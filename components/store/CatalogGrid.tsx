"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { productCatalog, type ProductCategory, type ProductConfig } from "@/lib/product-catalog";
import { SPRING, SPRING_SNAPPY } from "./Motion";
import ProductCard from "./ProductCard";

type SortKey = "featured" | "price-asc" | "price-desc";

const SORTS: { key: SortKey; tk: "featured" | "priceAsc" | "priceDesc" }[] = [
  { key: "featured", tk: "featured" },
  { key: "price-asc", tk: "priceAsc" },
  { key: "price-desc", tk: "priceDesc" },
];

// `items` comes from Firebase (server-fetched); falls back to the static catalog.
export default function CatalogGrid({ items = productCatalog }: { items?: ProductConfig[] }) {
  const t = useTranslations("catalog");
  const tCat = useTranslations("categories");
  const categories = useMemo(() => {
    const present = Array.from(new Set(items.map((p) => p.category)));
    return ["all", ...present] as ("all" | ProductCategory)[];
  }, [items]);

  const [active, setActive] = useState<"all" | ProductCategory>("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [sortOpen, setSortOpen] = useState(false);

  const products = useMemo(() => {
    const list = active === "all" ? items : items.filter((p) => p.category === active);
    if (sort === "price-asc") return [...list].sort((a, b) => a.startingPrice - b.startingPrice);
    if (sort === "price-desc") return [...list].sort((a, b) => b.startingPrice - a.startingPrice);
    return list;
  }, [items, active, sort]);

  const activeSortTk = SORTS.find((s) => s.key === sort)!.tk;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        {/* Category pills with sliding active indicator */}
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const selected = c === active;
            return (
              <motion.button
                key={c}
                onClick={() => setActive(c)}
                whileTap={{ scale: 0.94 }}
                className={`relative px-4 h-9 rounded-full text-sm font-medium border transition-colors ${
                  selected ? "border-neutral-900 text-white" : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="catpill"
                    className="absolute inset-0 rounded-full bg-neutral-900"
                    transition={SPRING_SNAPPY}
                  />
                )}
                <span className="relative z-10">{c === "all" ? t("all") : tCat(c)}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Sort + count */}
        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
          <span className="text-xs text-neutral-400 tabular-nums">
            {t("count", { count: products.length })}
          </span>
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              onBlur={() => setTimeout(() => setSortOpen(false), 120)}
              className="inline-flex items-center gap-2 h-9 pl-4 pr-3 rounded-full border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-400 transition-colors"
            >
              {t(`sort.${activeSortTk}`)}
              <motion.svg animate={{ rotate: sortOpen ? 180 : 0 }} transition={{ duration: 0.2 }} width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-11 z-20 w-52 rounded-2xl border border-neutral-100 bg-white shadow-xl p-1.5 origin-top-right"
                >
                  {SORTS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => { setSort(s.key); setSortOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                        s.key === sort ? "bg-neutral-900 text-white font-semibold" : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {t(`sort.${s.tk}`)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Grid — items spring into place when filtered/sorted */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {products.map((p) => (
            <motion.div
              key={p.slug}
              layout
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={SPRING}
              whileTap={{ scale: 0.98 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {products.length === 0 && (
        <div className="text-center py-20 text-sm text-neutral-400">{t("empty")}</div>
      )}
    </div>
  );
}
