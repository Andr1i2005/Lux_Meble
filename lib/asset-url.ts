// Resolves furniture assets (product photos, thumbnails, 3D models) to Firebase
// Storage, falling back to the local /public path otherwise. Storage mirrors the
// public folder layout: a local "/products/oslo-armchair.jpg" maps to the object
// "products/oslo-armchair.jpg".
//
// Images (jpg/png/webp/…) are ALWAYS served from Storage when a bucket is
// configured — admin-uploaded product photos only exist there, and <img> loads
// them cross-origin without CORS. Models and everything else follow the
// NEXT_PUBLIC_ASSETS_FROM_STORAGE flag (default off → local /public), so the 3D
// configurator keeps loading GLBs the way it always has.

import { storageBucket } from "./firebase";

const flagOn = process.env.NEXT_PUBLIC_ASSETS_FROM_STORAGE === "1";
const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

function storageUrl(path: string): string {
  const objectPath = path.replace(/^\//, "");
  return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodeURIComponent(objectPath)}?alt=media`;
}

/**
 * Given a local asset path (e.g. "/products/oslo-armchair.jpg"), returns the
 * Firebase Storage download URL when appropriate, otherwise the original local
 * path. Absolute URLs pass through untouched.
 */
export function assetUrl(path?: string): string | undefined {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path; // already absolute
  if (!storageBucket) return path; // no bucket → local only

  const fromStorage = IMAGE_RE.test(path) || flagOn;
  return fromStorage ? storageUrl(path) : path;
}

/** True when non-image assets are being served from Firebase Storage. */
export const assetsFromStorage = flagOn && Boolean(storageBucket);
