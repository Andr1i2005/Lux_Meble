/**
 * Splits mallory-sofa.glb into:
 *   mallory-sofa-only.glb   (sofa without ottoman — index-only patch, all vertex data intact)
 *   mallory-ottoman.glb     (ottoman only — separate index + vertex slice)
 *
 * Key insight: the sofa-only file is created by ONLY replacing the index buffer.
 * All vertex attribute data and textures stay byte-for-byte identical to the original.
 * Three.js ignores unreferenced (ottoman) vertices. This guarantees the file is valid.
 */

const fs   = require("fs");
const path = require("path");

const srcPath = path.resolve(__dirname, "../public/models/sofa/mallory-sofa.glb");
const buf     = fs.readFileSync(srcPath);

const jsonLen   = buf.readUInt32LE(12);
const json      = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
const binOffset = 20 + jsonLen + 8;

// ─── Read geometry ────────────────────────────────────────────────────────────

const prim    = json.meshes[0].primitives[0];
const posAcc  = json.accessors[prim.attributes.POSITION];
const idxAcc  = json.accessors[prim.indices];
const posBV   = json.bufferViews[posAcc.bufferView];
const idxBV   = json.bufferViews[idxAcc.bufferView];

const idxStart = binOffset + (idxBV.byteOffset ?? 0);
const posStart = binOffset + (posBV.byteOffset ?? 0);
const indices  = new Uint32Array(buf.buffer, buf.byteOffset + idxStart, idxAcc.count);
const posData  = new Float32Array(buf.buffer, buf.byteOffset + posStart, posAcc.count * 3);

// ─── Connected components + spatial clustering to find ottoman ────────────────

const parent = new Int32Array(posAcc.count);
for (let i = 0; i < posAcc.count; i++) parent[i] = i;
function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
function union(a, b) { a = find(a); b = find(b); if (a !== b) parent[a] = b; }
for (let i = 0; i < indices.length; i += 3) {
  union(indices[i], indices[i + 1]);
  union(indices[i + 1], indices[i + 2]);
}

const compBBox = {};
for (let i = 0; i < posAcc.count; i++) {
  const r = find(i);
  const x = posData[i * 3], y = posData[i * 3 + 1], z = posData[i * 3 + 2];
  if (!compBBox[r]) compBBox[r] = { minX: x, maxX: x, minY: y, maxY: y, minZ: z, maxZ: z };
  const b = compBBox[r];
  if (x < b.minX) b.minX = x; if (x > b.maxX) b.maxX = x;
  if (y < b.minY) b.minY = y; if (y > b.maxY) b.maxY = y;
  if (z < b.minZ) b.minZ = z; if (z > b.maxZ) b.maxZ = z;
}

const comps = Object.values(compBBox);
const sp = comps.map((_, i) => i);
function sf(x) { while (sp[x] !== x) { sp[x] = sp[sp[x]]; x = sp[x]; } return x; }
function su(a, b) { a = sf(a); b = sf(b); if (a !== b) sp[a] = b; }
const GAP = 15;
for (let i = 0; i < comps.length; i++)
  for (let j = i + 1; j < comps.length; j++) {
    const a = comps[i], b = comps[j];
    if (
      Math.min(a.maxX, b.maxX) + GAP > Math.max(a.minX, b.minX) - GAP &&
      Math.min(a.maxY, b.maxY) + GAP > Math.max(a.minY, b.minY) - GAP &&
      Math.min(a.maxZ, b.maxZ) + GAP > Math.max(a.minZ, b.minZ) - GAP
    ) su(i, j);
  }

const clusters = {};
comps.forEach((_, i) => {
  const r = sf(i);
  clusters[r] = clusters[r] || [];
  clusters[r].push(i);
});
const clArr = Object.values(clusters).sort((a, b) => a.length - b.length);
const ottomanCompIndices = new Set(clArr[0]); // smallest spatial cluster = ottoman

// Map vertex → component index
const compArr = Object.entries(compBBox);
const compIndexByRoot = {};
compArr.forEach(([root], i) => { compIndexByRoot[Number(root)] = i; });

const vertIsOttoman = new Uint8Array(posAcc.count);
for (let i = 0; i < posAcc.count; i++) {
  const ci = compIndexByRoot[find(i)];
  if (ottomanCompIndices.has(ci)) vertIsOttoman[i] = 1;
}

// ─── Split index buffers ──────────────────────────────────────────────────────

const sofaIdx    = [];
const ottomanIdx = [];
for (let i = 0; i < indices.length; i += 3) {
  const a = indices[i], b = indices[i + 1], c = indices[i + 2];
  const isOttoman = vertIsOttoman[a] && vertIsOttoman[b] && vertIsOttoman[c];
  (isOttoman ? ottomanIdx : sofaIdx).push(a, b, c);
}

console.log(`Sofa triangles: ${sofaIdx.length / 3}  Ottoman triangles: ${ottomanIdx.length / 3}`);

// ─── Helper: build GLB by patching just the index buffer ─────────────────────
// Strategy for sofa-only: keep ALL original vertex data, replace only indices.
// Three.js ignores unreferenced (ottoman) vertices — no visual difference.

function buildSofaOnlyGLB() {
  const newIdxBuf = Buffer.from(new Uint32Array(sofaIdx).buffer);
  // Align to 4 bytes (already fine since each index is 4 bytes)
  const delta = newIdxBuf.length - (idxBV.byteLength);  // negative (smaller)

  // Build new JSON: update index BV byteLength + accessor count,
  // shift byteOffset of all subsequent buffer views
  const newJson = JSON.parse(JSON.stringify(json)); // deep clone
  const idxBVIdx = idxAcc.bufferView;
  newJson.bufferViews[idxBVIdx].byteLength = newIdxBuf.length;
  newJson.accessors[prim.indices].count = sofaIdx.length;

  // Shift all buffer views that come AFTER the index buffer
  const idxBVEnd = (idxBV.byteOffset ?? 0) + idxBV.byteLength;
  newJson.bufferViews.forEach((bv, i) => {
    if (i === idxBVIdx) return;
    if ((bv.byteOffset ?? 0) >= idxBVEnd) {
      bv.byteOffset = (bv.byteOffset ?? 0) + delta;
    }
  });

  // Build new binary: replace old index bytes with new, keep rest
  const origBinLen  = buf.length - binOffset;
  const newBinLen   = origBinLen + delta;
  const newBin      = Buffer.alloc(newBinLen);

  // Copy new indices at offset 0
  newIdxBuf.copy(newBin, 0);

  // Copy the rest of the original binary (after the old index block)
  const srcAfterIdx = binOffset + (idxBV.byteOffset ?? 0) + idxBV.byteLength;
  buf.copy(newBin, newIdxBuf.length, srcAfterIdx);

  newJson.buffers[0].byteLength = newBinLen;

  return packGLB(newJson, newBin);
}

// ─── Helper: build ottoman-only GLB (full rebuild, compact vertices) ──────────

function buildOttomanGLB() {
  const TYPE_ELEMS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  const COMP_BYTES = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };

  // Remap vertices
  const oldToNew = new Int32Array(posAcc.count).fill(-1);
  let newVertCount = 0;
  for (let i = 0; i < posAcc.count; i++)
    if (vertIsOttoman[i]) oldToNew[i] = newVertCount++;

  // Remap indices
  const newIdx = new Uint32Array(ottomanIdx.length);
  for (let i = 0; i < ottomanIdx.length; i++) newIdx[i] = oldToNew[ottomanIdx[i]];

  // Build attribute buffers
  const attrKeys = Object.keys(prim.attributes);
  const attrBufs = {};
  for (const key of attrKeys) {
    const acc  = json.accessors[prim.attributes[key]];
    const bv   = json.bufferViews[acc.bufferView];
    const elems = TYPE_ELEMS[acc.type];
    const cb    = COMP_BYTES[acc.componentType];
    const stride = bv.byteStride || elems * cb;
    const srcStart = binOffset + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
    const newBuf = Buffer.alloc(newVertCount * elems * cb);
    for (let i = 0; i < posAcc.count; i++) {
      if (!vertIsOttoman[i]) continue;
      buf.copy(newBuf, oldToNew[i] * elems * cb, srcStart + i * stride, srcStart + i * stride + elems * cb);
    }
    attrBufs[key] = newBuf;
  }

  // Compute POSITION min/max
  const pb = attrBufs["POSITION"];
  let mnX = Infinity, mnY = Infinity, mnZ = Infinity;
  let mxX = -Infinity, mxY = -Infinity, mxZ = -Infinity;
  for (let i = 0; i < newVertCount; i++) {
    const x = pb.readFloatLE(i * 12), y = pb.readFloatLE(i * 12 + 4), z = pb.readFloatLE(i * 12 + 8);
    if (x < mnX) mnX = x; if (x > mxX) mxX = x;
    if (y < mnY) mnY = y; if (y > mxY) mxY = y;
    if (z < mnZ) mnZ = z; if (z > mxZ) mxZ = z;
  }

  // Collect texture buffer views from original
  const geomBVs = new Set([idxAcc.bufferView, ...attrKeys.map(k => json.accessors[prim.attributes[k]].bufferView)]);
  const texBVs  = json.bufferViews.map((bv, i) => ({ i, bv })).filter(({ i }) => !geomBVs.has(i));

  // Build binary: [idxBuf | attrBufs... | textures...]
  const align4 = b => { const r = b.length % 4; return r ? Buffer.concat([b, Buffer.alloc(4 - r)]) : b; };
  const idxBuf = align4(Buffer.from(newIdx.buffer));
  const parts  = [idxBuf, ...attrKeys.map(k => align4(attrBufs[k]))];
  const texBlobs = texBVs.map(({ bv }) =>
    align4(buf.slice(binOffset + (bv.byteOffset ?? 0), binOffset + (bv.byteOffset ?? 0) + bv.byteLength))
  );
  const binBlob = Buffer.concat([...parts, ...texBlobs]);

  // Buffer views
  const bvs  = [];
  const accs = [];
  let off = 0;

  // Index BV + accessor
  bvs.push({ buffer: 0, byteOffset: off, byteLength: idxBuf.length, target: 34963 });
  accs.push({ bufferView: 0, componentType: 5125, count: newIdx.length, type: "SCALAR" });
  off += idxBuf.length;
  const idxAccIdx = 0;

  // Attribute BVs + accessors
  const newAttrIdx = {};
  attrKeys.forEach((key, ki) => {
    const acc   = json.accessors[prim.attributes[key]];
    const elems = TYPE_ELEMS[acc.type];
    const cb    = COMP_BYTES[acc.componentType];
    const blob  = parts[ki + 1];
    const bvIdx = bvs.length;
    bvs.push({ buffer: 0, byteOffset: off, byteLength: blob.length });
    const a = { bufferView: bvIdx, componentType: acc.componentType, count: newVertCount, type: acc.type };
    if (key === "POSITION") { a.min = [mnX, mnY, mnZ]; a.max = [mxX, mxY, mxZ]; }
    accs.push(a);
    newAttrIdx[key] = accs.length - 1;
    off += blob.length;
  });

  // Texture BVs (original image data)
  const texBVIdxMap = {};
  texBVs.forEach(({ i, bv }, ti) => {
    texBVIdxMap[i] = bvs.length;
    bvs.push({ buffer: 0, byteOffset: off, byteLength: bv.byteLength });
    off += texBlobs[ti].length;
  });

  // Remap image bufferViews
  const newImages = (json.images || []).map(img => {
    if (typeof img.bufferView === "number" && texBVIdxMap[img.bufferView] !== undefined)
      return { ...img, bufferView: texBVIdxMap[img.bufferView] };
    return { ...img };
  });

  const newAttribs = {};
  attrKeys.forEach(k => { newAttribs[k] = newAttrIdx[k]; });

  // Copy original node hierarchy, remapping any mesh reference to 0
  const newNodes = (json.nodes || []).map(n => {
    const node = { ...n };
    if (typeof node.mesh === "number") node.mesh = 0;
    return node;
  });

  const newJson = {
    asset: json.asset,
    scene: 0,
    scenes: json.scenes || [{ nodes: [0] }],
    nodes: newNodes.length ? newNodes : [{ name: "mallory_ottoman", mesh: 0 }],
    meshes: [{ name: "mallory_ottoman", primitives: [{ attributes: newAttribs, indices: idxAccIdx, material: 0 }] }],
    accessors: accs,
    bufferViews: bvs,
    buffers: [{ byteLength: binBlob.length }],
    materials: json.materials,
    textures: json.textures,
    images: newImages,
    samplers: json.samplers,
  };

  return packGLB(newJson, binBlob);
}

function packGLB(jsonObj, binBuf) {
  const jsonStr = JSON.stringify(jsonObj);
  const jsonPad = jsonStr.padEnd(Math.ceil(jsonStr.length / 4) * 4, " ");
  const jsonBuf = Buffer.from(jsonPad, "utf8");
  const total   = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const out     = Buffer.alloc(total);
  let o = 0;
  out.writeUInt32LE(0x46546C67, o); o += 4;
  out.writeUInt32LE(2, o);          o += 4;
  out.writeUInt32LE(total, o);      o += 4;
  out.writeUInt32LE(jsonBuf.length, o); o += 4;
  out.writeUInt32LE(0x4E4F534A, o); o += 4;
  jsonBuf.copy(out, o);             o += jsonBuf.length;
  out.writeUInt32LE(binBuf.length, o); o += 4;
  out.writeUInt32LE(0x004E4942, o); o += 4;
  binBuf.copy(out, o);
  return out;
}

// ─── Write files ──────────────────────────────────────────────────────────────

const outDir = path.resolve(__dirname, "../public/models/sofa");
const sofaGlb   = buildSofaOnlyGLB();
const ottomanGlb = buildOttomanGLB();

fs.writeFileSync(path.join(outDir, "mallory-sofa-only.glb"), sofaGlb);
fs.writeFileSync(path.join(outDir, "mallory-ottoman.glb"),   ottomanGlb);

console.log(`mallory-sofa-only.glb  → ${(sofaGlb.length / 1024 / 1024).toFixed(1)} MB`);
console.log(`mallory-ottoman.glb    → ${(ottomanGlb.length / 1024 / 1024).toFixed(1)} MB`);
