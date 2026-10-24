import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const COLUMNS = [
  {
    key: "shop",
    links: [
      { key: "allFurniture", href: "/catalog" },
      { key: "configurator", href: "/configurator/nordvik-sofa" },
      { key: "newArrivals", href: "/catalog" },
    ],
  },
  {
    key: "company",
    links: [
      { key: "about", href: "/about" },
      { key: "craft", href: "/about" },
      { key: "sustainability", href: "/about" },
    ],
  },
  {
    key: "support",
    links: [
      { key: "orders", href: "/orders" },
      { key: "delivery", href: "/orders" },
      { key: "contact", href: "/about" },
    ],
  },
] as const;

export default function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-neutral-100 bg-neutral-50/40">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-base font-bold tracking-tight text-neutral-900">LuxMeble</Link>
          <p className="text-sm text-neutral-500 mt-3 max-w-xs leading-relaxed">
            {t("tagline")}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t("carbonNeutral")}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.key}>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-3">{t(`columns.${col.key}.title`)}</p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.key}>
                  <Link href={l.href} className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                    {t(`columns.${col.key}.${l.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-neutral-400">{t("rights")}</span>
          <span className="text-xs text-neutral-400">{t("madeIn")}</span>
        </div>
      </div>
    </footer>
  );
}
