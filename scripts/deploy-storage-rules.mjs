// Publishes Firebase Storage security rules (public read, no client write) using
// a service account via the Firebase Security Rules API. No console access needed.
//
// Usage: node scripts/deploy-storage-rules.mjs /path/to/serviceAccount.json
import { readFileSync } from "fs";
import { cert } from "firebase-admin/app";

const RULES_SOURCE = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;      // product images / models are public
      allow write: if false;    // uploads happen via the Admin SDK only
    }
  }
}`;

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

const saPath = process.argv[2];
if (!saPath) {
  console.error("Pass the service account path.");
  process.exit(1);
}
const sa = JSON.parse(readFileSync(saPath, "utf8"));
const env = loadEnv();
const projectId = sa.project_id;
const bucket = env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

const credential = cert(sa);
const { access_token } = await credential.getAccessToken();
const H = {
  Authorization: `Bearer ${access_token}`,
  "Content-Type": "application/json",
};
const BASE = `https://firebaserules.googleapis.com/v1/projects/${projectId}`;

// 1) Create a ruleset from the source.
const rulesetRes = await fetch(`${BASE}/rulesets`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({
    source: { files: [{ name: "storage.rules", content: RULES_SOURCE }] },
  }),
});
const ruleset = await rulesetRes.json();
if (!rulesetRes.ok) {
  console.error(
    `✗ Create ruleset failed (${rulesetRes.status}):`,
    JSON.stringify(ruleset),
  );
  process.exit(1);
}
console.log(`✓ Ruleset created: ${ruleset.name}`);

// 2) Release it for the storage bucket (release name: firebase.storage/<bucket>).
const releaseName = `projects/${projectId}/releases/firebase.storage/${bucket}`;
// Try update first; if the release doesn't exist yet, create it.
let relRes = await fetch(
  `${BASE}/releases/firebase.storage/${bucket}?updateMask=rulesetName`,
  {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({
      release: { name: releaseName, rulesetName: ruleset.name },
    }),
  },
);
if (relRes.status === 404 || relRes.status === 400) {
  relRes = await fetch(`${BASE}/releases`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ name: releaseName, rulesetName: ruleset.name }),
  });
}
const release = await relRes.json();
if (!relRes.ok) {
  console.error(
    `✗ Release failed (${relRes.status}):`,
    JSON.stringify(release),
  );
  process.exit(1);
}
console.log(`✓ Storage rules published for bucket ${bucket}`);
