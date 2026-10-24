// Catalog data layer — the single source of truth for products and configurator
// options is Firebase Realtime Database (node `catalog/*`). Reads use the RTDB
// REST API so they work in Server Components and at build time, and are cached
// by Next's fetch cache.
//
// The static arrays in product-catalog.ts / furniture-data.ts remain as the
// OFFLINE FALLBACK and the SEED source (see app/api/admin/seed): if the database
// is unreachable or not yet seeded, the site still renders the built-in catalog.
//
// Seed the database with `POST /api/admin/seed`, then manage content from there
// (or a future admin panel). Products are stored keyed by slug for easy editing.
import { getLocale } from "next-intl/server";
import {
  productCatalog,
  categoryLabels,
  type ProductConfig,
} from "./product-catalog";
import { productTranslations } from "./product-translations";
import {
  fabricOptions,
  legOptions,
  extraOptions,
  sofaModules,
} from "./furniture-data";
import type {
  FabricOption,
  LegOption,
  Extra,
  SofaModule,
} from "@/types/configurator";

export { categoryLabels };
export type { ProductConfig };

const DB = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.replace(/\/$/, "");
const REVALIDATE_SECONDS = 60;

/** RTDB returns arrays as objects (keyed by index or slug) — normalise to an array. */
function toArray<T>(val: unknown, fallback: T[]): T[] {
  if (val == null) return fallback;
  if (Array.isArray(val)) return val.filter(Boolean) as T[];
  if (typeof val === "object") return Object.values(val as Record<string, T>);
  return fallback;
}

async function readNode(path: string): Promise<unknown> {
  if (!DB) return null; // Firebase not configured → use fallback
  try {
    const res = await fetch(`${DB}/${path}.json`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Overlay per-locale content onto a product. Prefers the product's own
// `translations` (from Firebase) over the static overlay, so admins can edit
// translations in the database.
function localizeProduct(p: ProductConfig, locale: string): ProductConfig {
  if (locale === "en") return p;
  const tr =
    p.translations?.[locale as "pl" | "uk"] ??
    productTranslations[p.slug]?.[locale as "pl" | "uk"];
  if (!tr) return p;
  return {
    ...p,
    name: tr.name ?? p.name,
    subtitle: tr.subtitle ?? p.subtitle,
    description: tr.description ?? p.description,
    categoryLabel: tr.categoryLabel ?? p.categoryLabel,
  };
}

export async function getProducts(): Promise<ProductConfig[]> {
  const locale = await getLocale();
  const list = toArray<ProductConfig>(
    await readNode("catalog/products"),
    productCatalog,
  );
  return list.map((p) => localizeProduct(p, locale));
}

export async function getProduct(
  slug: string,
): Promise<ProductConfig | undefined> {
  const locale = await getLocale();
  const raw = await readNode(`catalog/products/${slug}`);
  const product =
    raw && typeof raw === "object"
      ? (raw as ProductConfig)
      : productCatalog.find((p) => p.slug === slug);
  return product ? localizeProduct(product, locale) : undefined;
}

export async function getFabricOptions(): Promise<FabricOption[]> {
  return toArray<FabricOption>(
    await readNode("catalog/fabrics"),
    fabricOptions,
  );
}

export async function getLegOptions(): Promise<LegOption[]> {
  return toArray<LegOption>(await readNode("catalog/legs"), legOptions);
}

export async function getExtraOptions(): Promise<Extra[]> {
  return toArray<Extra>(await readNode("catalog/extras"), extraOptions);
}

export async function getSofaModules(): Promise<SofaModule[]> {
  return toArray<SofaModule>(await readNode("catalog/modules"), sofaModules);
}
