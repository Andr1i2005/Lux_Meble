"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { productImage, type ProductConfig } from "@/lib/product-catalog";
import { useCartStore } from "@/store/cart-store";
import { assetUrl } from "@/lib/asset-url";
import Price from "./Price";
import ProductCard from "./ProductCard";

export default function ProductDetail({
  product,
  related,
}: {
  product: ProductConfig;
  related: ProductConfig[];
}) {
  const t = useTranslations("product");
  const router = useRouter();
  const { addItem, openCart } = useCartStore();

  // Detail hero shows the full photo first; the cart snapshot uses the small
  // card image (thumbnail-first).
  const hero = product.photo ?? productImage(product);

  function handleAddToCart() {
    addItem({
      id: product.slug,
      slug: product.slug,
      name: product.name,
      configLabel: product.subtitle,
      configQuery: "",
      unitPrice: product.startingPrice,
      thumbnail: productImage(product),
      accentColor: product.accentColor,
    });
    openCart();
  }

  return (
    <main className="max-w-6xl mx-auto px-6 md:px-8 py-8">
      <nav className="text-xs text-neutral-400 mb-6 flex items-center gap-1.5">
        <Link href="/catalog" className="hover:text-neutral-700 transition-colors">{t("breadcrumb")}</Link>
        <span>/</span>
        <span className="text-neutral-600">{product.categoryLabel}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Image */}
        <div
          className="relative aspect-[4/5] sm:aspect-square rounded-3xl overflow-hidden flex items-center justify-center"
          style={{ background: `radial-gradient(ellipse at 45% 58%, ${product.accentColor}1f 0%, ${product.accentColor}08 55%, #f4f4f4 100%)` }}
        >
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(hero)} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="w-32 h-16 rounded-xl" style={{ background: product.accentColor }} />
          )}
          {product.configurable && (
            <span className="absolute top-4 right-4 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/85 backdrop-blur-sm text-neutral-700 border border-neutral-200">
              {t("configurable")}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="lg:py-4">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">{product.categoryLabel}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 mt-1">{product.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">{product.subtitle}</p>

          <p className="mt-5 text-2xl font-bold text-neutral-900">
            {product.configurable && <span className="text-sm font-medium text-neutral-400">{t("from")} </span>}
            <Price value={product.startingPrice} />
          </p>

          {product.description && (
            <p className="mt-5 text-sm text-neutral-600 leading-relaxed max-w-md">{product.description}</p>
          )}

          {/* Dimensions */}
          <div className="mt-6 flex gap-6">
            {([["width", product.dimensions.w], ["depth", product.dimensions.d], ["height", product.dimensions.h]] as const).map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] text-neutral-400">{t(label)}</p>
                <p className="text-sm font-semibold text-neutral-800 mt-0.5">{value} cm</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {product.configurable ? (
              <>
                <Link
                  href={`/configurator/${product.slug}`}
                  className="flex-1 h-12 inline-flex items-center justify-center rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {t("configure")}
                </Link>
                <button
                  onClick={handleAddToCart}
                  className="h-12 px-6 inline-flex items-center justify-center rounded-full border border-neutral-200 text-sm font-semibold text-neutral-900 hover:border-neutral-400 transition-colors"
                >
                  {t("addBase")}
                </button>
              </>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M6 7h13l-1.2 9.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 4H3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {t("addToCart")}
              </button>
            )}
          </div>

          <button onClick={() => router.push("/catalog")} className="mt-4 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
            {t("back")}
          </button>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900 mb-5">{t("related")}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}
    </main>
  );
}
