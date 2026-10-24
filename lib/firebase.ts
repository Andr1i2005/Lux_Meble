// Firebase infrastructure for LuxMeble.
//   Auth     — Google sign-in (accounts, order ownership)
//   RTDB     — orders live under `orders/{uid}/{orderId}`, realtime tracking
//   Storage  — furniture images / 3D models (see lib/asset-url.ts)
//
// When env config is absent, `firebaseEnabled` is false: sign-in and orders are
// unavailable (there is no local/guest order storage). The rest of the site —
// catalog, configurator, cart — still works.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// RTDB needs an explicit database URL. If it isn't provided we derive the
// default-instance URL from the project id (US region). For a non-US database,
// set NEXT_PUBLIC_FIREBASE_DATABASE_URL from the console (it shows the region).
const databaseURL =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : undefined);

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL,
};

/** True only when the minimum Firebase web config is present. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

/** The Storage bucket, used to build public asset download URLs. */
export const storageBucket = config.storageBucket;

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Database | undefined;
let storage: FirebaseStorage | undefined;

// Initialise on the client only — the SDKs expect a browser.
if (firebaseEnabled && typeof window !== "undefined") {
  app = getApps().length
    ? getApp()
    : initializeApp(config as Record<string, string>);
  auth = getAuth(app);
  db = getDatabase(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
