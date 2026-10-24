// DELETE /api/admin/products/[slug] — remove a product (admin-only).
import { NextResponse } from "next/server";
import { adminDb, adminEnabled } from "@/lib/firebase-admin";
import { adminFromRequest } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!adminEnabled || !adminDb) {
    return NextResponse.json({ error: "Admin SDK is not configured" }, { status: 503 });
  }
  const admin = await adminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const ref = adminDb.ref(`catalog/products/${slug.toLowerCase()}`);
  if (!(await ref.get()).exists()) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  await ref.remove();
  return NextResponse.json({ ok: true });
}
