import "server-only";
import { adminAuth } from "./firebase-admin";

/**
 * Verifies the Firebase ID token from an `Authorization: Bearer <token>` header
 * and returns the caller's uid, or null if missing/invalid. Route handlers use
 * this to authorise trusted operations.
 */
export async function uidFromRequest(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/i);
  if (!match || !adminAuth) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(match[1]);
    return decoded.uid;
  } catch {
    return null;
  }
}

/** Allowed admin emails, from ADMIN_EMAILS (comma-separated, case-insensitive). */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export interface AdminIdentity {
  uid: string;
  email: string;
}

/**
 * Verifies the caller's ID token AND that their email is in ADMIN_EMAILS.
 * Returns the admin identity, or null if not authenticated / not an admin.
 */
export async function adminFromRequest(req: Request): Promise<AdminIdentity | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/i);
  if (!match || !adminAuth) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(match[1]);
    const email = (decoded.email ?? "").toLowerCase();
    if (!email || !adminEmails().includes(email)) return null;
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}
