// Server-side validation for an incoming order draft. Guards against tampered
// payloads (negative prices, empty carts, a total that doesn't match the items).
//
// NOTE: this checks internal consistency of the submitted prices. A fully
// authoritative check would re-price each line from the catalog + configurator
// rules server-side; that belongs here once the pricing engine is shared.
import type { OrderDraft } from "@/lib/order-model";

const MAX_ITEMS = 50;
const TOTAL_TOLERANCE = 0.5; // currency rounding slack

type Result = { ok: true; draft: OrderDraft } | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function validateOrderDraft(body: unknown): Result {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.items) || b.items.length === 0) return { ok: false, error: "Cart is empty" };
  if (b.items.length > MAX_ITEMS) return { ok: false, error: "Too many items" };

  let computed = 0;
  for (const raw of b.items) {
    const it = raw as Record<string, unknown>;
    if (!isNonEmptyString(it.name)) return { ok: false, error: "Item missing name" };
    const qty = Number(it.qty);
    const unitPrice = Number(it.unitPrice);
    if (!Number.isInteger(qty) || qty <= 0) return { ok: false, error: "Invalid quantity" };
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return { ok: false, error: "Invalid price" };
    computed += unitPrice * qty;
  }

  const total = Number(b.total);
  if (!Number.isFinite(total) || Math.abs(total - computed) > TOTAL_TOLERANCE) {
    return { ok: false, error: "Total does not match items" };
  }

  const shipping = b.shipping as Record<string, unknown> | undefined;
  if (!shipping || !isNonEmptyString(shipping.name) || !isNonEmptyString(shipping.address)) {
    return { ok: false, error: "Incomplete shipping address" };
  }
  if (!isNonEmptyString(b.email)) return { ok: false, error: "Email required" };

  // Re-project into a clean OrderDraft (drop any extra client-sent fields).
  const draft: OrderDraft = {
    email: String(b.email),
    total: computed,
    shipping: {
      name: String(shipping.name),
      address: String(shipping.address),
      city: String(shipping.city ?? ""),
      postal: String(shipping.postal ?? ""),
      country: String(shipping.country ?? ""),
    },
    items: (b.items as Record<string, unknown>[]).map((it) => ({
      name: String(it.name),
      configLabel: String(it.configLabel ?? ""),
      qty: Number(it.qty),
      unitPrice: Number(it.unitPrice),
      thumbnail: it.thumbnail ? String(it.thumbnail) : undefined,
      accentColor: String(it.accentColor ?? "#000000"),
    })),
  };
  return { ok: true, draft };
}
