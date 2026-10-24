// PATCH /api/orders/[id] — update an order's shipment progress server-side.
//
// Body: { action: "advance" | "reset", days?: number }. Advancing shifts
// `createdAt` backwards (fast-forwards the time-based tracking model); reset
// sets it to now. In production this route is where an admin/fulfilment system
// would drive real status transitions instead of the demo controls.
import { NextResponse } from "next/server";
import { adminDb, adminEnabled } from "@/lib/firebase-admin";
import { uidFromRequest } from "@/lib/api-auth";
import { advanceStageFields, resetStageFields, type OrderStageInfo } from "@/lib/order-tracking";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!adminEnabled || !adminDb) {
    return NextResponse.json({ error: "Server orders are not configured" }, { status: 503 });
  }

  const uid = await uidFromRequest(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const orderRef = adminDb.ref(`orders/${uid}/${id.toUpperCase()}`);
  const snap = await orderRef.get();
  if (!snap.exists()) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const order = snap.val() as OrderStageInfo;
  const now = Date.now();

  if (body.action === "reset") {
    await orderRef.update(resetStageFields(order, now));
  } else if (body.action === "advance") {
    await orderRef.update(advanceStageFields(order, now));
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
