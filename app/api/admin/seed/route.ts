// POST /api/admin/seed — write the built-in catalog into Firebase RTDB `catalog/*`.
//
// One-off (and re-runnable) seed so the database mirrors the static data, after
// which content is managed from Firebase / a future admin panel. Products are
// stored keyed by slug for easy per-item edits; options are stored as arrays.
//
// Guarded by a shared secret. Send:  x-seed-key: <ADMIN_SEED_SECRET>
import { NextResponse } from "next/server";
import { adminDb, adminEnabled } from "@/lib/firebase-admin";
import { productCatalog, categoryLabels } from "@/lib/product-catalog";
import { fabricOptions, legOptions, extraOptions, sofaModules } from "@/lib/furniture-data";

export const runtime = "nodejs";

// Strip `undefined` (RTDB rejects it) and produce plain JSON.
function clean<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function POST(req: Request) {
  if (!adminEnabled || !adminDb) {
    return NextResponse.json({ error: "Admin SDK is not configured" }, { status: 503 });
  }

  const secret = process.env.ADMIN_SEED_SECRET;
  if (!secret || req.headers.get("x-seed-key") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const catalog = clean({
    products: Object.fromEntries(productCatalog.map((p) => [p.slug, p])),
    fabrics: fabricOptions,
    legs: legOptions,
    extras: extraOptions,
    modules: sofaModules,
    categoryLabels,
  });

  await adminDb.ref("catalog").set(catalog);

  return NextResponse.json({
    ok: true,
    counts: {
      products: productCatalog.length,
      fabrics: fabricOptions.length,
      legs: legOptions.length,
      extras: extraOptions.length,
      modules: sofaModules.length,
    },
  });
}
