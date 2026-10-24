// One-shot: seed the catalog into RTDB + upload assets to Storage, using a
// Firebase service account (bypasses security rules — no need to open them).
//
// Usage:
//   node scripts/seed-firebase.mjs /path/to/serviceAccount.json
//   (or set GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_CLIENT_EMAIL +
//    FIREBASE_PRIVATE_KEY in .env.local)
//
// Get the key: Firebase console → Project settings (⚙) → Service accounts →
// Generate new private key. Then run the command above with its path.
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, dirname, relative, extname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getStorage } from "firebase-admin/storage";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC_DIR = join(ROOT, "public");
const FOLDERS = ["products", "thumbnails", "models"];

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
};

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(join(ROOT, ".env.local"), "utf8").split(
      "\n",
    )) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return env;
}

function resolveCredential(env) {
  const path = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path && existsSync(path)) {
    const sa = JSON.parse(readFileSync(path, "utf8"));
    return {
      credential: cert(sa),
      projectId: sa.project_id,
      bucketGuess: `${sa.project_id}.appspot.com`,
    };
  }
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = env.FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (clientEmail && privateKey && projectId) {
    return {
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
      bucketGuess: `${projectId}.appspot.com`,
    };
  }
  return null;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "_tmp") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  const env = loadEnv();
  const cred = resolveCredential(env);
  if (!cred) {
    console.error(
      "No service account. Pass its path:  node scripts/seed-firebase.mjs /path/to/serviceAccount.json",
    );
    process.exit(1);
  }

  const databaseURL =
    env.FIREBASE_DATABASE_URL ||
    env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    `https://${cred.projectId}-default-rtdb.firebaseio.com`;
  const storageBucket = env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || cred.bucketGuess;

  const app = initializeApp({
    credential: cred.credential,
    databaseURL,
    storageBucket,
  });

  // 1) Catalog → RTDB
  const catalog = JSON.parse(
    readFileSync(join(__dirname, "catalog-seed.json"), "utf8"),
  );
  await getDatabase(app).ref("catalog").set(catalog);
  console.log(
    `✓ RTDB catalog seeded — ${Object.keys(catalog.products).length} products, ${catalog.fabrics.length} fabrics, ${catalog.legs.length} legs, ${catalog.extras.length} extras, ${catalog.modules.length} modules`,
  );

  // 2) Assets → Storage
  const bucket = getStorage(app).bucket(storageBucket);
  const files = [];
  for (const folder of FOLDERS) {
    const dir = join(PUBLIC_DIR, folder);
    try {
      files.push(...walk(dir));
    } catch {}
  }
  let ok = 0;
  for (const file of files) {
    const destination = relative(PUBLIC_DIR, file).split("\\").join("/");
    const contentType =
      CONTENT_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
    try {
      await bucket.upload(file, { destination, metadata: { contentType } });
      ok++;
    } catch (err) {
      console.error(`  ✗ ${destination} — ${err.message}`);
    }
  }
  console.log(
    `✓ Storage — ${ok}/${files.length} assets uploaded to ${storageBucket}`,
  );
  console.log(
    "\nDone. Set NEXT_PUBLIC_ASSETS_FROM_STORAGE=1 in .env.local to serve assets from Storage.",
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
