// Server-only Firebase Admin SDK. Used by Route Handlers to perform trusted
// operations (creating/validating orders, updating shipment status) with a
// service account — never import this from a client component.
//
// Credentials come from server env vars (NOT NEXT_*, so they never reach
// the browser). Without them `adminEnabled` is false and the API routes return
// 503, so the app keeps working with client-side RTDB writes.
import "server-only";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getDatabase, type Database } from "firebase-admin/database";
import { getStorage, type Storage } from "firebase-admin/storage";

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// Resolve the private key. FIREBASE_PRIVATE_KEY_B64 (the whole PEM base64-encoded
// into one line with no spaces/newlines/quotes) is the bulletproof option — it
// can't be mangled by env-var editors. Falls back to FIREBASE_PRIVATE_KEY, which
// we normalise for real newlines, escaped "\n", wrapping quotes and whitespace.
function normalizePrivateKey(raw?: string): string | undefined {
  if (!raw) return undefined;
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1); // strip a single pair of wrapping quotes
  }
  // Collapse any indentation the host may have added to each PEM line, then turn
  // escaped "\n" into real newlines (real newlines already pass through).
  return key
    .replace(/\\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}
function resolvePrivateKey(): string | undefined {
  const b64 = process.env.FIREBASE_PRIVATE_KEY_B64?.trim();
  if (b64) {
    try {
      return Buffer.from(b64, "base64").toString("utf8").trim();
    } catch {
      /* fall through to the plain key */
    }
  }
  return normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
}
const privateKey = resolvePrivateKey();
const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : undefined);
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

/** True only when a full service account is present in the environment. */
const hasCredentials = Boolean(
  projectId && clientEmail && privateKey && databaseURL,
);

/** The Storage bucket name, for admin uploads. */
export const adminStorageBucket = storageBucket;

let app: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Database | undefined;
let adminStorage: Storage | undefined;

if (hasCredentials) {
  try {
    app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
          databaseURL,
          storageBucket,
        });
    adminAuth = getAuth(app);
    adminDb = getDatabase(app);
    adminStorage = getStorage(app);
  } catch (err) {
    // A malformed FIREBASE_PRIVATE_KEY (wrong newlines, stray quotes, truncated)
    // makes cert() throw. Don't crash the whole route (500) — log it and leave
    // the SDK disabled so callers return a clean 503 / "not configured".
    console.error(
      "[firebase-admin] Failed to initialise the Admin SDK — check FIREBASE_PRIVATE_KEY formatting:",
      (err as Error)?.message ?? err,
    );
  }
}

/** True only when the Admin SDK actually initialised successfully. */
export const adminEnabled = Boolean(app && adminDb);

export { adminAuth, adminDb, adminStorage };
