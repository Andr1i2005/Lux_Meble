// Sets CORS on the Storage bucket so cross-origin GET works (needed for loading
// .glb models via three.js GLTFLoader from Storage). Uses the service account.
//
// Usage: node scripts/set-storage-cors.mjs /path/to/serviceAccount.json
import { readFileSync } from "fs";
import { cert } from "firebase-admin/app";

const saPath = process.argv[2];
if (!saPath) {
  console.error("Pass the service account path.");
  process.exit(1);
}
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
const bucket =
  env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${sa.project_id}.firebasestorage.app`;

const cors = [
  {
    origin: ["*"],
    method: ["GET", "HEAD"],
    responseHeader: ["Content-Type", "Content-Length", "Cache-Control"],
    maxAgeSeconds: 3600,
  },
];

const { access_token } = await cert(sa).getAccessToken();
const res = await fetch(
  `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}?fields=cors`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cors }),
  },
);
const body = await res.json();
if (!res.ok) {
  console.error(`✗ Failed (${res.status}):`, JSON.stringify(body));
  process.exit(1);
}
console.log(`✓ CORS set on ${bucket}:`, JSON.stringify(body.cors));
