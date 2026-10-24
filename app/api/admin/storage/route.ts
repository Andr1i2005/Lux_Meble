// GET /api/admin/storage?q=<query> — list Storage image objects matching a query
// (admin-only), for the product-form path autocomplete. Returns short paths plus
// a preview URL for each match.
import { NextResponse } from "next/server";
import { adminStorage, adminStorageBucket, adminEnabled } from "@/lib/firebase-admin";
import { adminFromRequest } from "@/lib/api-auth";

export const runtime = "nodejs";

const IMAGE_RE = /\.(jpe?g|png|webp|avif|gif)$/i;
const FOLDERS = ["products", "thumbnails"];
const LIMIT = 12;

export async function GET(req: Request) {
  if (!adminEnabled || !adminStorage || !adminStorageBucket) {
    return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });
  }
  const admin = await adminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Normalize: object names have no leading slash (e.g. "products/x.jpg"), while
  // the field value does ("/products/x.jpg") — strip it so both match by path.
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase().replace(/^\/+/, "");
  const bucket = adminStorage.bucket(adminStorageBucket);

  // List image objects under the known asset folders.
  const groups = await Promise.all(
    FOLDERS.map((prefix) => bucket.getFiles({ prefix: `${prefix}/` }).then(([files]) => files)),
  );
  const names = groups.flat().map((f) => f.name).filter((n) => IMAGE_RE.test(n));

  const matches = names
    .filter((n) => !q || n.toLowerCase().includes(q))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, LIMIT)
    .map((name) => ({
      path: `/${name}`,
      url: `https://firebasestorage.googleapis.com/v0/b/${adminStorageBucket}/o/${encodeURIComponent(name)}?alt=media`,
    }));

  return NextResponse.json({ matches });
}
