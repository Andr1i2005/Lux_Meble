import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import SiteHeader from "@/components/store/SiteHeader";
import CatalogGrid from "@/components/store/CatalogGrid";
import { FadeIn } from "@/components/store/Motion";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop — LuxMeble",
  description: "Browse the LuxMeble collection of configurable furniture.",
};

export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const products = await getProducts();
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <FadeIn className="mb-8">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">{t("eyebrow")}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">{t("title")}</h1>
          <p className="text-sm text-neutral-500 mt-2 max-w-lg">{t("subtitle")}</p>
        </FadeIn>
        <CatalogGrid items={products} />
      </main>
    </div>
  );
}
