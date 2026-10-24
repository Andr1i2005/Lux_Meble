// Builds scripts/catalog-seed.json from the static TS data (no Firebase needed).
// Node 22+ strips the `import type` lines, so the .ts modules import directly.
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { productCatalog, categoryLabels } = await import("../lib/product-catalog.ts");
const { fabricOptions, legOptions, extraOptions, sofaModules } = await import("../lib/furniture-data.ts");

const catalog = {
  products: Object.fromEntries(productCatalog.map((p) => [p.slug, p])),
  fabrics: fabricOptions,
  legs: legOptions,
  extras: extraOptions,
  modules: sofaModules,
  categoryLabels,
};

// Drop undefined (RTDB rejects it).
const clean = JSON.parse(JSON.stringify(catalog));
const out = join(__dirname, "catalog-seed.json");
writeFileSync(out, JSON.stringify(clean, null, 2));

console.log(`Wrote ${out}`);
console.log(`  products: ${productCatalog.length}, fabrics: ${fabricOptions.length}, legs: ${legOptions.length}, extras: ${extraOptions.length}, modules: ${sofaModules.length}`);
