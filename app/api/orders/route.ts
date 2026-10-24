// POST /api/orders — create an order server-side with the Admin SDK.
//
// Trusted path (enabled via NEXT_PUBLIC_USE_SERVER_ORDERS=1): the client posts
// the cart + shipping with its Firebase ID token; the server verifies the token,
// validates the draft, stamps the id/tracking/timestamp, and writes it under
// orders/{uid}. This keeps price/total checks off the client.
import { NextResponse } from "next/server";
import { adminDb, adminEnabled } from "@/lib/firebase-admin";
import { uidFromRequest } from "@/lib/api-auth";
import { validateOrderDraft } from "@/lib/order-validation";
import { initialStageFields } from "@/lib/order-tracking";
import {
  newOrderId,
  newTrackingNumber,
  randomCarrier,
  type Order,
} from "@/lib/order-model";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!adminEnabled || !adminDb) {
    return NextResponse.json(
      { error: "Server orders are not configured" },
      { status: 503 },
    );
  }

  const uid = await uidFromRequest(req);
  if (!uid)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = validateOrderDraft(body);
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: 400 });

  const createdAt = Date.now();
  const order: Order = {
    ...result.draft,
    id: newOrderId(),
    createdAt,
    carrier: randomCarrier(),
    trackingNumber: newTrackingNumber(),
    ...initialStageFields(createdAt),
  };

  await adminDb.ref(`orders/${uid}/${order.id}`).set(order);
  return NextResponse.json({ order }, { status: 201 });
}
