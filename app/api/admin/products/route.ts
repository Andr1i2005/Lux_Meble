// Admin product management (admin-only, verified via ADMIN_EMAILS).
//   GET  /api/admin/products         → raw products list from RTDB catalog
//   POST /api/admin/products         → create or update a product (upsert by slug)
import { NextResponse } from "next/server";
import { adminDb, adminEnabled } from "@/lib/firebase-admin";
import { adminFromRequest } from "@/lib/api-auth";
import type { ProductConfig } from "@/lib/product-catalog";

export const runtime = "nodejs";

// RTDB rejects `undefined`; strip it and produce plain JSON.
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function requireAdmin(req: Request) {
  if (!adminEnabled || !adminDb) return { error: "Admin SDK is not configured", status: 503 as const };
  const admin = await adminFromRequest(req);
  if (!admin) return { error: "Unauthorized", status: 401 as const };
  return { admin };
}

export async function GET(req: Request) {
  const gate = await requireAdmin(req);
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const snap = await adminDb!.ref("catalog/products").get();
  const val = (snap.val() ?? {}) as Record<string, ProductConfig>;
  const products = Object.values(val).sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const gate = await requireAdmin(req);
  if ("error" in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: Partial<ProductConfig>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slug = (body.slug ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: "Slug must be lowercase words separated by hyphens." }, { status: 400 });
  }
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!Number.isFinite(Number(body.startingPrice)) || Number(body.startingPrice) < 0) {
    return NextResponse.json({ error: "Starting price must be a non-negative number." }, { status: 400 });
  }
  // Translations required for both locales (subtitle + category label; description optional).
  for (const loc of ["pl", "uk"] as const) {
    const tr = body.translations?.[loc];
    if (!tr?.subtitle?.trim() || !tr?.categoryLabel?.trim()) {
      return NextResponse.json({ error: `${loc.toUpperCase()} subtitle and category label are required.` }, { status: 400 });
    }
  }

  const ref = adminDb!.ref(`catalog/products/${slug}`);
  const existing = (await ref.get()).val() as ProductConfig | null;

  // Merge over any existing product so fields not in the form (e.g. variants,
  // modelPathWithPillows) are preserved on edit. `createdAt` is stamped once on
  // creation and never changed by edits (drives "New arrivals" ordering).
  const merged = clean({
    ...(existing ?? {}),
    ...body,
    slug,
    createdAt: existing?.createdAt ?? Date.now(),
  }) as ProductConfig;
  await ref.set(merged);

  return NextResponse.json({ ok: true, product: merged, created: !existing });
}
