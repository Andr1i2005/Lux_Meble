// Order domain model — types plus id / tracking-code generators.
//
// Orders are persisted ONLY in Firebase Realtime Database (see lib/use-orders.ts).
// There is no local/guest storage: placing and viewing orders requires sign-in.

export interface OrderItemSnapshot {
  name: string;
  configLabel: string;
  qty: number;
  unitPrice: number;
  thumbnail?: string;
  accentColor: string;
}

export interface OrderAddress {
  name: string;
  address: string;
  city: string;
  postal: string;
  country: string;
}

export interface Order {
  id: string;
  createdAt: number;
  items: OrderItemSnapshot[];
  total: number;
  email: string;
  shipping: OrderAddress;
  carrier: string;
  trackingNumber: string;
  // Persisted shipment status (source of truth). When absent (legacy orders),
  // the tracking model falls back to deriving the stage from elapsed time.
  stageIndex?: number;                        // current stage 0..7
  stageUpdatedAt?: number;                    // when the stage last changed
  stageTimestamps?: Record<string, number>;   // real timestamp each reached stage happened, keyed by stage key
}

export type OrderDraft = Omit<Order, "id" | "createdAt" | "carrier" | "trackingNumber">;

const CARRIERS = ["LuxMeble Express", "DHL Freight", "GLS Home"];

function randomCode(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function newOrderId(): string {
  return `LM-${randomCode(6)}`;
}

export function newTrackingNumber(): string {
  return `${randomCode(2)}${Math.floor(100000000 + Math.random() * 899999999)}${randomCode(2)}`;
}

export function randomCarrier(): string {
  return CARRIERS[Math.floor(Math.random() * CARRIERS.length)];
}
