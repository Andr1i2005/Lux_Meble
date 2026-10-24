// Publishes the Realtime Database security rules using a service account
// (via the /.settings/rules.json REST endpoint). No console access needed.
//
// Usage: node scripts/deploy-rtdb-rules.mjs /path/to/serviceAccount.json
import { readFileSync } from "fs";
import { cert } from "firebase-admin/app";

const RULES = {
  rules: {
    orders: {
      $uid: {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
      },
    },
    catalog: {
      ".read": true,
      ".write": false,
    },
  },
};

const saPath = process.argv[2];
const sa = JSON.parse(readFileSync(saPath, "utf8"));

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(
      new URL("../.env.local", import.meta.url),
      "utf8",
    ).split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return env;
}

const env = loadEnv();
const databaseURL =
  env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  `https://${sa.project_id}-default-rtdb.firebaseio.com`;

const token = await cert(sa).getAccessToken();
const res = await fetch(
  `${databaseURL.replace(/\/$/, "")}/.settings/rules.json?access_token=${token.access_token}`,
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(RULES),
  },
);

const text = await res.text();
if (res.ok) {
  console.log(`✓ RTDB rules published to ${databaseURL}`);
} else {
  console.error(`✗ Failed (${res.status}): ${text}`);
  process.exit(1);
}
