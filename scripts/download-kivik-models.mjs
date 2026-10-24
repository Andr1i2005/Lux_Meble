/**
 * Downloads IKEA KIVIK models by:
 * 1. Fetching kivik-core.json to find GLTF URLs
 * 2. Downloading each GLTF + its .bin + textures
 * 3. Packing each piece into a single .glb with gltf-transform
 *
 * Run: node scripts/download-kivik-models.mjs
 */

import { chromium }  from "playwright";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = join(__dirname, "../public/models/kivik");
const TMP_DIR   = join(OUT_DIR, "_tmp");
[OUT_DIR, TMP_DIR].forEach((d) => { if (!existsSync(d)) mkdirSync(d, { recursive: true }); });

const CDN_BASE   = "https://content.dexf.ikea.com/cdn/asset/kivik/rt";
const CORE_JSON  = "https://www.ikea.com/addon-app/sofas/content/2.0.1421/kivik-core.json";
const HEADERS    = { "Referer": "https://www.ikea.com/", "User-Agent": "Mozilla/5.0" };

// Known .bin filenames (from network inspection)
const KNOWN_BINS = [
  "KIVIK_2_SEAT.bin",
  "KIVIK_3_SEAT.bin",
  "KIVIK_ARMREST.bin",
  "KIVIK_CHS_LNG.bin",
  "KIVIK_CORNER.bin",
  "KIVIK_FOOTSTOOL.bin",
  "KIVIK_SOFABED.bin",
];

async function fetchBuf(url) {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

async function fetchText(url) {
  const r = await fetch(url, { headers: HEADERS });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.text();
}

// ── Step 1: get kivik-core.json and extract GLTF URLs ─────────────────────────
async function discoverFromCoreJson() {
  console.log("Fetching kivik-core.json…");
  const text = await fetchText(CORE_JSON);
  const json = JSON.parse(text);

  // Write for inspection
  writeFileSync(join(TMP_DIR, "kivik-core.json"), text);
  console.log("  Saved kivik-core.json for inspection");

  // Collect all .gltf URLs mentioned
  const gltfUrls = new Set();
  const walk = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string" && v.includes(".gltf")) gltfUrls.add(v);
      else walk(v);
    }
  };
  walk(json);

  return { json, gltfUrls: [...gltfUrls] };
}

// ── Step 2: download a GLTF + its referenced .bin + textures ─────────────────
async function downloadGltfPiece(gltfUrl, label) {
  console.log(`\n[${label}] Downloading ${gltfUrl}…`);

  // Download GLTF JSON
  const gltfText = await fetchText(gltfUrl);
  const gltf     = JSON.parse(gltfText);
  writeFileSync(join(TMP_DIR, `${label}.gltf`), gltfText);

  // Collect referenced URIs (buffers + images)
  const refs = new Set();
  (gltf.buffers ?? []).forEach((b) => { if (b.uri && !b.uri.startsWith("data:")) refs.add(b.uri); });
  (gltf.images  ?? []).forEach((i) => { if (i.uri && !i.uri.startsWith("data:")) refs.add(i.uri); });

  for (const ref of refs) {
    const url  = ref.startsWith("http") ? ref : `${CDN_BASE}/${ref}`;
    const name = basename(ref);
    const dest = join(TMP_DIR, name);
    if (existsSync(dest)) { console.log(`  skip ${name} (cached)`); continue; }
    try {
      const buf = await fetchBuf(url);
      writeFileSync(dest, buf);
      console.log(`  ✓ ${name}  (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.warn(`  ✗ ${name}: ${e.message}`);
    }
  }

  return { label, gltf, refs: [...refs] };
}

// ── Step 3: convert GLTF → GLB using gltf-transform ──────────────────────────
async function packToGlb(label) {
  const gltfPath = join(TMP_DIR, `${label}.gltf`);
  const glbPath  = join(OUT_DIR, `${label}.glb`);

  const { NodeIO } = await import("@gltf-transform/core").catch(() => null) ?? {};
  if (!NodeIO) {
    console.warn("  @gltf-transform/core not installed — saving GLTF + bin as-is");
    return;
  }

  try {
    const io  = new NodeIO();
    const doc = await io.read(gltfPath);
    const glb = await io.writeBinary(doc);
    writeFileSync(glbPath, glb);
    console.log(`  ✓ packed → ${label}.glb  (${(glb.length / 1024 / 1024).toFixed(2)} MB)`);
  } catch (e) {
    console.warn(`  ✗ pack failed: ${e.message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  // Get core JSON and find GLTF URLs
  const { json, gltfUrls } = await discoverFromCoreJson();

  console.log(`\nFound ${gltfUrls.length} GLTF URL(s) in kivik-core.json:`);
  gltfUrls.forEach((u) => console.log(`  ${u}`));

  // Also try known bin files with browser-intercepted GLTF hashes
  const interceptedGltfs = {
    "kivik-2seater":    "https://content.dexf.ikea.com/cdn/asset/kivik/rt/ag2golol2gva.gltf",
    "kivik-armrest":    "https://content.dexf.ikea.com/cdn/asset/kivik/rt/46xeb1x945k8.gltf",
    "kivik-chaise":     "https://content.dexf.ikea.com/cdn/asset/kivik/rt/98slayjtdb8v.gltf",
    "kivik-corner":     "https://content.dexf.ikea.com/cdn/asset/kivik/rt/6y1tpeyel9d0.gltf",
    "kivik-footstool":  "https://content.dexf.ikea.com/cdn/asset/kivik/rt/44k4y3eidc3e.gltf",
    "kivik-sofabed":    "https://content.dexf.ikea.com/cdn/asset/kivik/rt/9nmbsjflalbc.gltf",
  };

  // Merge with any from core JSON
  if (gltfUrls.length > 0) {
    gltfUrls.forEach((u, i) => {
      const key = `kivik-piece-${i}`;
      if (!Object.values(interceptedGltfs).includes(u)) interceptedGltfs[key] = u;
    });
  }

  // Download each piece
  const results = [];
  for (const [label, url] of Object.entries(interceptedGltfs)) {
    try {
      const r = await downloadGltfPiece(url, label);
      results.push(r);
    } catch (e) {
      console.warn(`  ✗ ${label}: ${e.message}`);
    }
  }

  // Check for 3-seater specifically (might have a different hash)
  // Try to guess by using Playwright to load the planner fresh and only click 3-seater
  console.log("\n── Hunting for 3-seater specifically with Playwright ────────");
  const browser = await chromium.launch({ headless: true });
  const ctx     = await browser.newContext();
  const page    = await ctx.newPage();

  let seaterGltfUrl = null;

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("dexf.ikea.com") && url.includes(".gltf")) {
      console.log(`  gltf request: ${url}`);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (!url.includes("dexf.ikea.com") || !url.includes(".gltf")) return;
    try {
      const text = await res.text();
      const gltf = JSON.parse(text);
      const bins  = (gltf.buffers ?? []).map((b) => b.uri ?? "");
      if (bins.some((b) => b.includes("3_SEAT") || b.includes("3SEAT") || b.includes("three"))) {
        seaterGltfUrl = url;
        console.log(`  ✓ Found 3-seater GLTF: ${url}`);
      }
      // Log all bin names
      if (bins.length > 0) console.log(`  → bins: ${bins.join(", ")}  ← ${url}`);
    } catch { /* ignore */ }
  });

  // Load planner and navigate to a clean state, then click 3-seater
  const PLANNER = "https://www.ikea.com/addon-app/sofas/kivik/web/latest/gb/en/?cover=";
  await page.goto(PLANNER, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(5_000);

  // Try clicking 3-seat sofa option
  const btn3 = await page.$('[role="button"][aria-label*="3-seat sofa"]');
  if (btn3) {
    await btn3.click();
    await page.waitForTimeout(6_000);
    console.log("  Clicked 3-seat sofa button");
  } else {
    console.log("  3-seat sofa button not found");
  }

  await browser.close();

  if (seaterGltfUrl) {
    try {
      await downloadGltfPiece(seaterGltfUrl, "kivik-3seater");
      results.push({ label: "kivik-3seater" });
    } catch (e) {
      console.warn(`  ✗ 3-seater download failed: ${e.message}`);
    }
  }

  // Try to convert to GLB
  console.log("\n── Trying to pack GLTF → GLB ─────────────────────────────");
  for (const { label } of results) {
    await packToGlb(label);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n── Summary ─────────────────────────────────────────────────");
  console.log(`GLTF files saved in:  ${TMP_DIR}`);
  console.log(`GLB files saved in:   ${OUT_DIR}`);
  console.log("\nFiles downloaded:");
  results.forEach(({ label }) => console.log(`  ✓ ${label}.gltf`));
  console.log("\nNext step: run  npx @gltf-transform/cli pack  to merge GLTF+bin → GLB");
  console.log("Or install:  npm i -D @gltf-transform/core @gltf-transform/cli");
}

run().catch((e) => { console.error(e); process.exit(1); });
