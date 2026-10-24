# GLTF Model Loading — Pitfalls & Proven Patterns

## 1. Check node-level scale before applying your own

GLTF/GLB nodes can carry a `scale` transform baked into the scene graph. If a model was exported from software that stores geometry in millimetres, the exporter often adds `scale: [0.001, 0.001, 0.001]` on each node so the scene renders in metres in GLTF viewers.

**The trap:** you see "geometry is in mm" in the source file → you add `scale={0.001}` to `<primitive>` → the model shrinks to `0.001 × 0.001 = 0.000001` of its original size and becomes invisible.

**How to check (Node.js):**
```js
import { readFileSync } from "fs";
const buf = readFileSync("public/models/foo.glb");
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
json.nodes?.forEach((n, i) => console.log(i, JSON.stringify(n)));
```

Look for a `scale` field on the nodes. If they already have `scale: [0.001, ...]`, render with no extra scale (or `scale={1}`).

**IKEA KIVIK models specifically:** nodes carry `scale ≈ 0.001`, geometry is stored in mm, world space is already metres. Use no extra scale.

---

## 2. Draco-decoded COLOR_0 vertex count mismatch

IKEA models compressed with Draco sometimes decode `COLOR_0` with a different vertex count than `POSITION`. Example: `POSITION=10530`, `COLOR_0=10483`. This triggers:

```
GL_INVALID_OPERATION: glDrawElements: Vertex buffer is not big enough (×256)
```

The mesh renders nothing (invisible geometry, no shadow).

**Fix at conversion time** using `@gltf-transform/core` — strip `COLOR_0` from every primitive before writing the GLB:

```js
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const colorAcc = prim.getAttribute("COLOR_0");
    if (colorAcc) {
      prim.setAttribute("COLOR_0", null);
      if (colorAcc.listParents().length === 0) colorAcc.dispose();
    }
  }
}
```

Do this after reading the Draco-compressed GLTF and before writing the GLB. See `scripts/convert-kivik-to-glb.mjs`.

**Do NOT try to fix this at runtime** (e.g. `obj.geometry.deleteAttribute("color")` after `useGLTF`). The interleaved WebGL buffer is already uploaded with the wrong stride — Three.js will still crash.

---

## 3. Floor positioning after node-scale is correct

Once you know the node scale is already `0.001`, use gltf-transform to read the actual Y extents from the POSITION accessors (in mm) and derive the floor offset:

```js
const pos = prim.getAttribute("POSITION");
const arr = pos.getArray();
let minY = Infinity;
for (let i = 1; i < arr.length; i += 3) minY = Math.min(minY, arr[i]);
// minY is in mm; node scale converts it to metres automatically
// So floor offset = -minY * 0.001 (rounded up slightly)
```

For KIVIK 2-seater: `minY ≈ -415mm` → `FLOOR_Y = 0.42` keeps the bottom just above Y=0.

---

## 4. Draco conversion recipe (gltf-transform)

To convert a Draco-compressed GLTF+bin into a clean GLB:

```js
import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression, KHRTextureTransform } from "@gltf-transform/extensions";
import draco3d from "draco3d";

const decoderModule = await draco3d.createDecoderModule();
const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression, KHRTextureTransform])
  .registerDependencies({ "draco3d.decoder": decoderModule });

const doc = await io.read("model.gltf");

// 1. Strip the Draco extension (geometry is already decoded into accessors)
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (ext.extensionName === "KHR_draco_mesh_compression") ext.dispose();
}

// 2. Strip COLOR_0 (often has mismatched vertex count after Draco decode)
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const acc = prim.getAttribute("COLOR_0");
    if (acc) {
      prim.setAttribute("COLOR_0", null);
      if (acc.listParents().length === 0) acc.dispose();
    }
  }
}

// 3. Write clean GLB (no encoder needed since Draco was disposed)
const glb = await io.writeBinary(doc);
```

Required packages: `@gltf-transform/core`, `@gltf-transform/extensions`, `draco3d`.

---

## 5. Verify a GLB before wiring it to the component

Quick sanity checks to run before spending time debugging the React component:

```bash
# 1. Check node transforms
node --input-type=module -e "
import { readFileSync } from 'fs';
const buf = readFileSync('public/models/foo.glb');
const json = JSON.parse(buf.slice(20, 20 + buf.readUInt32LE(12)).toString('utf8'));
json.nodes?.forEach((n, i) => console.log(i, JSON.stringify(n)));
"

# 2. Check bounding box in model-local space
# (use gltf-transform to read POSITION accessor and compute min/max per axis)

# 3. Confirm the file is served
curl -o /dev/null -w "%{http_code} %{size_download}" http://localhost:3000/models/foo.glb
```

If the file returns 200 with correct size but nothing appears in the scene, the node scale is almost always the culprit.
