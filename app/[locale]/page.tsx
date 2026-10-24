import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getProducts } from "@/lib/catalog";
import { assetUrl } from "@/lib/asset-url";
import Price from "@/components/store/Price";
import SiteHeader from "@/components/store/SiteHeader";
import ProductCard from "@/components/store/ProductCard";
import ShopTheLook from "@/components/store/ShopTheLook";
import SiteFooter from "@/components/store/SiteFooter";
import { FadeIn, Reveal, Stagger, StaggerItem } from "@/components/store/Motion";

const IconCube = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M12 2.5l8 4.5v9l-8 4.5-8-4.5v-9l8-4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M4 7l8 4.5L20 7M12 11.5V21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
const IconGem = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M6 3h12l3 5-9 13L3 8l3-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M3 8h18M9 3l-1.5 5L12 21l4.5-13L15 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
const IconTruck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M2.5 6.5h11v9h-11v-9zM13.5 9.5h4l3 3v3h-7v-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="6.5" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17.5" cy="17.5" r="1.8" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const VALUE_PROPS = [
  { icon: IconCube,  key: "realtime" },
  { icon: IconGem,   key: "materials" },
  { icon: IconTruck, key: "delivery" },
] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const products = await getProducts();
  const featured = products.slice(0, 4);
  // Newest first by creation date (products without a date sort last).
  const newArrivals = [...products]
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, 4);
  const hero = products.find((p) => p.slug === "nordvik-sofa");
  const heroPhoto = hero?.photo;

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center pt-10 md:pt-14 pb-12 lg:py-0 lg:h-[calc(100svh-4rem)] lg:min-h-[560px] lg:max-h-[860px]">
        <FadeIn delay={0.05}>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-neutral-500 bg-neutral-50 border border-neutral-100 rounded-full pl-2 pr-3.5 py-1.5">
            <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-2 py-0.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t("liveBadge")}
            </span>
            {t("badge")}
          </span>
          <h1 className="text-[2.6rem] leading-[1.04] md:text-6xl md:leading-[1.02] font-bold text-neutral-900 tracking-[-0.02em] mt-5">
            {t("hero.line1")}<br />
            <span className="italic font-medium text-neutral-500">{t("hero.emphasis")}</span> {t("hero.line2")}
          </h1>
          <p className="text-base md:text-lg text-neutral-500 mt-6 leading-relaxed max-w-md">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-9">
            <Link href="/catalog" className="px-6 h-12 inline-flex items-center rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">
              {t("hero.ctaShop")}
            </Link>
            <Link href="/configurator/nordvik-sofa" className="group px-6 h-12 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 text-sm font-semibold text-neutral-900 hover:border-neutral-900 transition-colors">
              {t("hero.ctaTry")}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 mt-10">
            <div className="flex -space-x-2">
              {["#5B7C6B", "#A6713F", "#566A7B", "#8B7F72"].map((c) => (
                <span key={c} className="w-7 h-7 rounded-full border-2 border-white" style={{ background: c }} />
              ))}
            </div>
            <p className="text-xs text-neutral-500 leading-tight">
              <span className="text-amber-500">★★★★★</span>{" "}
              <span className="font-semibold text-neutral-900">4.9</span> · {t("hero.rating")}
            </p>
          </div>
        </FadeIn>

        {/* Hero image card */}
        <FadeIn delay={0.18} className="lg:flex lg:justify-center">
        <Link
          href="/configurator/nordvik-sofa"
          className="group relative w-full max-w-[480px] lg:max-w-none mx-auto lg:flex lg:justify-center"
        >
          <div className="relative w-full max-w-[480px] aspect-[4/5] lg:w-auto lg:h-[min(74vh,600px)] rounded-[28px] overflow-hidden bg-neutral-100 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
            {heroPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={assetUrl(heroPhoto)} alt="Nordvik Sofa" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-[700ms] ease-out" draggable={false} />
            )}
            <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/45 to-transparent" />

            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-800 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {t("livePreview")}
            </span>

            <span className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <span className="text-white">
                <span className="block text-[11px] font-medium text-white/70">{t("featured")}</span>
                <span className="block text-lg font-semibold leading-tight">{hero?.name ?? "Nordvik Sofa"}</span>
                <span className="block text-xs text-white/80 mt-0.5">{tc("from")} {hero ? <Price value={hero.startingPrice} /> : ""}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-neutral-900 bg-white rounded-full px-4 py-2 shadow-md group-hover:gap-2.5 transition-all">
                Configure →
              </span>
            </span>
          </div>
        </Link>
        </FadeIn>
      </section>

      {/* Value props */}
      <section className="border-y border-neutral-100 bg-neutral-50/40">
        <Stagger className="max-w-7xl mx-auto px-6 md:px-8 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
          {VALUE_PROPS.map((v) => (
            <StaggerItem key={v.key} className="flex items-start gap-3.5 py-6 sm:px-6 first:sm:pl-0 last:sm:pr-0">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-white border border-neutral-100 flex items-center justify-center text-neutral-900 shadow-sm">
                <v.icon />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">{t(`values.${v.key}.title`)}</h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{t(`values.${v.key}.desc`)}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Shop the look */}
      <ShopTheLook products={products} />

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-14">
        <Reveal className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">{t("featuredSection.title")}</h2>
            <p className="text-sm text-neutral-500 mt-1">{t("featuredSection.subtitle")}</p>
          </div>
          <Link href="/catalog" className="text-sm font-semibold text-neutral-900 hover:underline shrink-0">{tc("viewAll")}</Link>
        </Reveal>
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((p) => <StaggerItem key={p.slug}><ProductCard product={p} /></StaggerItem>)}
        </Stagger>
      </section>

      {/* New arrivals */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-14">
        <Reveal className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">{t("newArrivals.title")}</h2>
            <p className="text-sm text-neutral-500 mt-1">{t("newArrivals.subtitle")}</p>
          </div>
          <Link href="/catalog" className="text-sm font-semibold text-neutral-900 hover:underline shrink-0">{tc("viewAll")}</Link>
        </Reveal>
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {newArrivals.map((p) => <StaggerItem key={p.slug}><ProductCard product={p} /></StaggerItem>)}
        </Stagger>
      </section>

      {/* CTA band */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-16">
        <Reveal className="rounded-3xl bg-neutral-900 text-white px-8 md:px-14 py-12 md:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t("ctaBand.title")}</h2>
            <p className="text-sm text-neutral-300 mt-2 max-w-md">{t("ctaBand.subtitle")}</p>
          </div>
          <Link href="/catalog" className="px-6 h-12 inline-flex items-center rounded-full bg-white text-neutral-900 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
            {t("ctaBand.button")}
          </Link>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
