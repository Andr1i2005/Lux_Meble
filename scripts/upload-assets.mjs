/**
 * Uploads local /public furniture assets to Firebase Storage, preserving the
 * folder layout so `lib/asset-url.ts` can map "/products/x.jpg" → the Storage
 * object "products/x.jpg".
 *
 * Uploads: public/products, public/thumbnails, public/models (images + .glb).
 *
 * Run:  node scripts/upload-assets.mjs
 *
 * Reads Firebase web config from .env.local. The Storage rules must allow the
 * write while this runs — either sign in below, or temporarily set:
 *   match /{allPaths=**} { allow read; allow write: if true; }
 * then restore read-only public rules afterwards (see docs/firebase-setup.md).
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, dirname, relative, extname } from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes } from "firebase/storage";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC_DIR = join(ROOT, "public");

// Which /public subfolders to mirror into Storage.
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
  const raw = readFileSync(join(ROOT, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "_tmp") continue; // skip .DS_Store, temp
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  const env = loadEnv();
  const app = initializeApp({
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  const storage = getStorage(app);

  const files = [];
  for (const folder of FOLDERS) {
    const dir = join(PUBLIC_DIR, folder);
    try {
      files.push(...walk(dir));
    } catch {
      console.warn(`  (skip ${folder} — not found)`);
    }
  }

  console.log(
    `Uploading ${files.length} assets to ${env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}…\n`,
  );
  let ok = 0;
  for (const file of files) {
    const objectPath = relative(PUBLIC_DIR, file).split("\\").join("/");
    const contentType =
      CONTENT_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
    try {
      await uploadBytes(ref(storage, objectPath), readFileSync(file), {
        contentType,
      });
      console.log(`  ✓ ${objectPath}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${objectPath} — ${err.message}`);
    }
  }
  console.log(`\nDone — ${ok}/${files.length} uploaded.`);
  console.log("Set NEXT_PUBLIC_ASSETS_FROM_STORAGE=1 in .env.local to serve them.");
  process.exit(ok === files.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
