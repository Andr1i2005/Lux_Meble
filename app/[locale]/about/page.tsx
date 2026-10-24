import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SiteHeader from "@/components/store/SiteHeader";
import SiteFooter from "@/components/store/SiteFooter";
import { FadeIn, Reveal, Stagger, StaggerItem } from "@/components/store/Motion";

export const metadata: Metadata = {
  title: "About — LuxMeble",
  description: "The story, craft and people behind LuxMeble — made-to-order furniture from our Kraków atelier.",
};

const STATS = [
  { value: "2019", key: "founded" },
  { value: "12,000+", key: "homes" },
  { value: "4.9★", key: "rating" },
  { value: "8", key: "countries" },
] as const;

const VALUE_ICONS = {
  madeToOrder: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2.5l8 4.5v9l-8 4.5-8-4.5v-9l8-4.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M4 7l8 4.5L20 7M12 11.5V21" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
  ),
  honestMaterials: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 3h12l3 5-9 13L3 8l3-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M3 8h18M9 3l-1.5 5L12 21l4.5-13L15 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
  ),
  builtToLast: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 9.5C8 19.2 5 15.5 5 11V6l7-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M9 11.5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
} as const;

const VALUE_KEYS = ["madeToOrder", "honestMaterials", "builtToLast"] as const;

const TIMELINE = [
  { year: "2019", key: "y2019" },
  { year: "2021", key: "y2021" },
  { year: "2023", key: "y2023" },
  { year: "2026", key: "y2026" },
] as const;

const TEAM = [
  { name: "Marta Nowak", key: "founder", color: "#5B7C6B" },
  { name: "Piotr Lewandowski", key: "craft", color: "#A6713F" },
  { name: "Sofia Marchenko", key: "materials", color: "#566A7B" },
  { name: "Jakub Zieliński", key: "care", color: "#8B7F72" },
] as const;

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2);
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center pt-12 md:pt-16 pb-14">
        <FadeIn delay={0.05}>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-4">{t("eyebrow")}</p>
          <h1 className="text-[2.4rem] leading-[1.05] md:text-5xl md:leading-[1.05] font-bold text-neutral-900 tracking-[-0.02em]">
            {t("heroTitle")}<br />
            <span className="italic font-medium text-neutral-500">{t("heroEmphasis")}</span>
          </h1>
          <p className="text-base md:text-lg text-neutral-500 mt-6 leading-relaxed max-w-md">
            {t("heroText")}
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/catalog" className="px-6 h-12 inline-flex items-center rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              {t("exploreCollection")}
            </Link>
            <Link href="/configurator/nordvik-sofa" className="px-6 h-12 inline-flex items-center rounded-full border border-neutral-200 text-sm font-semibold text-neutral-900 hover:border-neutral-900 transition-colors">
              {t("tryConfigurator")}
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.18}>
          <div className="relative aspect-[5/4] rounded-[28px] overflow-hidden bg-neutral-100 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.3)] ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/interior.jpg" alt="A LuxMeble living room" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </FadeIn>
      </section>

      {/* Stats */}
      <section className="border-y border-neutral-100 bg-neutral-50/40">
        <Stagger className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-2 sm:grid-cols-4 divide-x divide-neutral-100">
          {STATS.map((s) => (
            <StaggerItem key={s.key} className="py-8 px-4 first:pl-0 text-center sm:text-left">
              <p className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">{s.value}</p>
              <p className="text-xs text-neutral-500 mt-1">{t(`stats.${s.key}`)}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Story + image */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <Reveal>
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/products/interior-lounge.jpg" alt="LuxMeble lounge" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-3">{t("storyEyebrow")}</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">{t("storyTitle")}</h2>
          <p className="text-sm md:text-base text-neutral-500 mt-4 leading-relaxed">{t("storyP1")}</p>
          <p className="text-sm md:text-base text-neutral-500 mt-4 leading-relaxed">{t("storyP2")}</p>
        </Reveal>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-4">
        <Reveal className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">{t("valuesTitle")}</h2>
        </Reveal>
        <Stagger className="grid sm:grid-cols-3 gap-4">
          {VALUE_KEYS.map((k) => (
            <StaggerItem key={k} className="rounded-3xl border border-neutral-100 p-6 hover:border-neutral-300 hover:shadow-sm transition-all">
              <span className="inline-flex w-11 h-11 rounded-2xl bg-neutral-900 text-white items-center justify-center mb-4">{VALUE_ICONS[k]}</span>
              <h3 className="text-base font-semibold text-neutral-900">{t(`values.${k}.title`)}</h3>
              <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{t(`values.${k}.desc`)}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Timeline */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <Reveal className="mb-8">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">{t("timelineEyebrow")}</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">{t("timelineTitle")}</h2>
        </Reveal>
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TIMELINE.map((item) => (
            <StaggerItem key={item.year} className="relative rounded-3xl bg-neutral-50/70 border border-neutral-100 p-6">
              <span className="text-3xl font-bold tracking-tight text-neutral-900">{item.year}</span>
              <h3 className="text-sm font-semibold text-neutral-900 mt-3">{t(`timeline.${item.key}.title`)}</h3>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">{t(`timeline.${item.key}.desc`)}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-16">
        <Reveal className="mb-8">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">{t("teamEyebrow")}</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">{t("teamTitle")}</h2>
        </Reveal>
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map((m) => (
            <StaggerItem key={m.name} className="rounded-3xl border border-neutral-100 p-6 text-center hover:shadow-sm transition-shadow">
              <span className="inline-flex w-16 h-16 rounded-full items-center justify-center text-white text-lg font-bold mb-4" style={{ background: m.color }}>
                {initials(m.name)}
              </span>
              <p className="text-sm font-semibold text-neutral-900">{m.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{t(`team.${m.key}`)}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 pb-16">
        <Reveal className="rounded-3xl bg-neutral-900 text-white px-8 md:px-14 py-12 md:py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t("ctaTitle")}</h2>
            <p className="text-sm text-neutral-300 mt-2 max-w-md">{t("ctaText")}</p>
          </div>
          <Link href="/catalog" className="px-6 h-12 inline-flex items-center rounded-full bg-white text-neutral-900 text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
            {t("ctaButton")}
          </Link>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}
