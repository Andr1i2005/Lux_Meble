// POST /api/admin/upload — upload a product image to Storage (admin-only).
// Body: multipart/form-data with `file` (and optional `folder`, default "products").
// Returns { path } as a short "/products/<name>.jpg" — assetUrl() resolves image
// paths to the public Storage URL, so it displays while staying tidy to store.
import { NextResponse } from "next/server";
import { adminStorage, adminStorageBucket, adminEnabled } from "@/lib/firebase-admin";
import { adminFromRequest } from "@/lib/api-auth";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function slugifyName(name: string): string {
  return name.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "image";
}

export async function POST(req: Request) {
  if (!adminEnabled || !adminStorage || !adminStorageBucket) {
    return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });
  }
  const admin = await adminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG or WebP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 8 MB or smaller." }, { status: 400 });
  }

  const folder = (form?.get("folder") as string | null)?.replace(/[^a-z]/g, "") || "products";
  const objectPath = `${folder}/${slugifyName(file.name)}.${EXT[file.type]}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await adminStorage.bucket(adminStorageBucket).file(objectPath).save(buffer, {
    contentType: file.type,
    metadata: { cacheControl: "public, max-age=31536000" },
  });

  // Short path; assetUrl() resolves image paths to the public Storage URL.
  return NextResponse.json({ path: `/${objectPath}` });
}
