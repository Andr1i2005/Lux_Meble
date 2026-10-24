/**
 * Converts KIVIK GLTF+bin (Draco-compressed) → clean GLB.
 * COLOR_0 is stripped because Draco decodes it with a mismatched vertex count,
 * which causes WebGL glDrawElements errors in Three.js.
 */
import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP_DIR = join(__dirname, "../public/models/kivik/_tmp");
const OUT_DIR = join(__dirname, "../public/models/kivik");

const PIECES = [
  "kivik-2seater",
  "kivik-3seater",
  "kivik-armrest",
  "kivik-chaise",
  "kivik-corner",
  "kivik-footstool",
  "kivik-sofabed",
];

async function convert(name) {
  const gltfPath = join(TMP_DIR, `${name}.gltf`);
  const glbPath  = join(OUT_DIR, `${name}.glb`);

  if (!existsSync(gltfPath)) {
    console.warn(`  ✗ ${name}.gltf not found — skipping`);
    return false;
  }

  const { NodeIO } = await import("@gltf-transform/core");
  const { KHRDracoMeshCompression, KHRTextureTransform } = await import("@gltf-transform/extensions");
  const draco3d = await import("draco3d");

  const decoderModule = await draco3d.createDecoderModule();

  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression, KHRTextureTransform])
    .registerDependencies({ "draco3d.decoder": decoderModule });

  console.log(`  reading ${name}.gltf…`);
  const doc = await io.read(gltfPath);

  // Strip Draco extension (geometry already decoded into accessors)
  for (const ext of doc.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === "KHR_draco_mesh_compression") ext.dispose();
  }

  // Remove COLOR_0 from every primitive — Draco decodes it with a mismatched
  // vertex count vs POSITION, which causes WebGL glDrawElements to crash in Three.js.
  let stripped = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const colorAcc = prim.getAttribute("COLOR_0");
      if (colorAcc) {
        prim.setAttribute("COLOR_0", null);
        // Dispose accessor if nothing else references it
        if (colorAcc.listParents().length === 0) colorAcc.dispose();
        stripped++;
      }
    }
  }
  if (stripped > 0) console.log(`  stripped COLOR_0 from ${stripped} primitive(s)`);

  console.log(`  writing ${name}.glb…`);
  const glb = await io.writeBinary(doc);
  writeFileSync(glbPath, glb);
  console.log(`  ✓ ${name}.glb  (${(glb.length / 1024 / 1024).toFixed(2)} MB)`);
  return true;
}

async function run() {
  console.log("Converting KIVIK GLTF → GLB…\n");
  let ok = 0;
  for (const name of PIECES) {
    const success = await convert(name);
    if (success) ok++;
  }
  console.log(`\nDone: ${ok}/${PIECES.length} converted → ${OUT_DIR}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
