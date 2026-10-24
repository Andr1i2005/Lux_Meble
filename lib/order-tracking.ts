// Pure, time-based order-tracking model. Status is derived from how much time
// has elapsed since the order was placed, so it advances on its own and stays
// consistent between the list and the detail view. A demo "advance" control on
// the tracking page shifts `createdAt` backwards to fast-forward the journey.

export interface TrackStageDef {
  key: string;
  label: string;
  description: string;
  location: string;
  offsetDays: number; // when this stage is reached, in days after the order
}

export const ORDER_STAGES: TrackStageDef[] = [
  { key: "placed",     label: "Order placed",     description: "We’ve received your order.",                location: "luxmeble.com",        offsetDays: 0 },
  { key: "confirmed",  label: "Order confirmed",  description: "Payment authorised, order confirmed.",      location: "Kraków, PL",          offsetDays: 0.15 },
  { key: "production", label: "In production",    description: "Your piece is being made to order.",        location: "Kraków atelier, PL",  offsetDays: 1 },
  { key: "quality",    label: "Quality check",    description: "Final inspection and protective packing.",  location: "Kraków atelier, PL",  offsetDays: 3 },
  { key: "shipped",    label: "Shipped",          description: "Handed over to the carrier.",               location: "Warsaw hub, PL",      offsetDays: 4 },
  { key: "transit",    label: "In transit",       description: "On its way to your regional depot.",        location: "Wrocław · Berlin",    offsetDays: 5.5 },
  { key: "out",        label: "Out for delivery", description: "With the courier — arriving today.",        location: "Local depot",         offsetDays: 7 },
  { key: "delivered",  label: "Delivered",        description: "Delivered to your address.",                location: "Your address",        offsetDays: 8 },
];

export const DAY_MS = 86_400_000;
export const SHIPPED_INDEX = 4;
const LAST = ORDER_STAGES.length - 1;
const TOTAL_DAYS = ORDER_STAGES[LAST].offsetDays;

export interface TrackStage extends TrackStageDef {
  date: number;     // timestamp this stage is / will be reached
  done: boolean;    // already happened
  current: boolean; // the active stage right now
}

export interface OrderProgress {
  stages: TrackStage[];
  currentIndex: number;
  percent: number;    // 0..100 across the whole journey
  delivered: boolean;
  shipped: boolean;
  eta: number;        // estimated delivery timestamp
}

// Minimal order shape the tracking model reads. `stageIndex`/`stageTimestamps`
// are the persisted status; when absent the stage is derived from elapsed time.
export interface OrderStageInfo {
  createdAt: number;
  stageIndex?: number;
  stageTimestamps?: Record<string, number>;
}

/** Resolve the current stage index: explicit when persisted, else time-derived. */
export function resolveStageIndex(order: OrderStageInfo, now: number): number {
  if (typeof order.stageIndex === "number") {
    return Math.max(0, Math.min(LAST, order.stageIndex));
  }
  const elapsedDays = (now - order.createdAt) / DAY_MS;
  let idx = 0;
  for (let i = 0; i < ORDER_STAGES.length; i++) {
    if (elapsedDays >= ORDER_STAGES[i].offsetDays) idx = i;
  }
  return idx;
}

export function getOrderProgress(order: OrderStageInfo, now: number): OrderProgress {
  const { createdAt, stageTimestamps } = order;
  const currentIndex = resolveStageIndex(order, now);
  const delivered = currentIndex >= LAST;

  const stages: TrackStage[] = ORDER_STAGES.map((s, i) => ({
    ...s,
    // Prefer the real recorded timestamp; fall back to the estimated date.
    date: stageTimestamps?.[s.key] ?? createdAt + s.offsetDays * DAY_MS,
    done: i < currentIndex || (delivered && i === LAST),
    current: i === currentIndex && !delivered,
  }));

  const explicit = typeof order.stageIndex === "number";
  const percent = explicit
    ? (currentIndex / LAST) * 100
    : Math.max(0, Math.min(100, ((now - createdAt) / DAY_MS / TOTAL_DAYS) * 100));

  return {
    stages,
    currentIndex,
    percent,
    delivered,
    shipped: currentIndex >= SHIPPED_INDEX,
    eta: stageTimestamps?.[ORDER_STAGES[LAST].key] ?? createdAt + TOTAL_DAYS * DAY_MS,
  };
}

export function stageStatusLabel(p: OrderProgress): string {
  return p.stages[p.currentIndex]?.label ?? "Order placed";
}

// ── Persisted-status writes ────────────────────────────────────────────────
// Pure helpers returning the exact fields to write to RTDB, so the client and
// the server (Admin SDK) produce identical updates.

/** Stage fields for a brand-new order (starts at "Order placed"). */
export function initialStageFields(createdAt: number) {
  return {
    stageIndex: 0,
    stageUpdatedAt: createdAt,
    stageTimestamps: { [ORDER_STAGES[0].key]: createdAt },
  };
}

/** Fields to advance an order to its next stage, stamping the reached stage. */
export function advanceStageFields(order: OrderStageInfo, now: number) {
  const next = Math.min(resolveStageIndex(order, now) + 1, LAST);
  const key = ORDER_STAGES[next].key;
  return {
    stageIndex: next,
    stageUpdatedAt: now,
    stageTimestamps: { ...(order.stageTimestamps ?? {}), [key]: now },
  };
}

/** Fields to reset an order back to "Order placed". */
export function resetStageFields(order: OrderStageInfo, now: number) {
  return {
    stageIndex: 0,
    stageUpdatedAt: now,
    stageTimestamps: { [ORDER_STAGES[0].key]: order.createdAt },
  };
}
