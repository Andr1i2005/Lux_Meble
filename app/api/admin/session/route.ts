// GET /api/admin/session — tells the admin UI whether the signed-in user is an
// admin (email in ADMIN_EMAILS). Authoritative check happens server-side; the
// client only uses this to show/hide the admin UI.
import { NextResponse } from "next/server";
import { adminEnabled } from "@/lib/firebase-admin";
import { adminFromRequest } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!adminEnabled) {
    return NextResponse.json({ admin: false, configured: false });
  }
  const admin = await adminFromRequest(req);
  return NextResponse.json({ admin: Boolean(admin), configured: true, email: admin?.email ?? null });
}
