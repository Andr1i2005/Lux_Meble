"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeNames, localeShort, type Locale } from "@/i18n/routing";
import { useHydrated } from "@/lib/use-hydrated";
import { useCurrencyStore, CURRENCIES, CURRENCY_META, type Currency } from "@/store/currency-store";

export default function LanguageSwitcher() {
  const t = useTranslations("switcher");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const storeCurrency = useCurrencyStore((s) => s.currency);
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const currency: Currency = hydrated ? storeCurrency : "EUR";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function switchLocale(next: Locale) {
    setOpen(false);
    if (next !== locale) router.replace(pathname, { locale: next });
  }

  function switchCurrency(next: Currency) {
    setOpen(false);
    if (next !== currency) setCurrency(next);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 h-10 px-2.5 rounded-full text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
        aria-label={t("label")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        {localeShort[locale]}
        <span className="text-neutral-300">·</span>
        {CURRENCY_META[currency].symbol}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            role="menu"
            className="absolute right-0 mt-2 w-48 rounded-2xl border border-neutral-100 bg-white shadow-lg p-1.5 z-50"
          >
            {/* Language */}
            <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{t("language")}</p>
            {routing.locales.map((l) => (
              <button
                key={l}
                role="menuitemradio"
                aria-checked={l === locale}
                onClick={() => switchLocale(l)}
                className={`flex items-center justify-between w-full h-9 px-3 rounded-xl text-sm transition-colors ${
                  l === locale ? "bg-neutral-900 text-white font-semibold" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {localeNames[l]}
                <span className={`text-[11px] font-semibold ${l === locale ? "text-white/70" : "text-neutral-400"}`}>{localeShort[l]}</span>
              </button>
            ))}

            {/* Currency */}
            <div className="my-1.5 border-t border-neutral-100" />
            <p className="px-3 pt-0.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{t("currency")}</p>
            {CURRENCIES.map((c) => (
              <button
                key={c}
                role="menuitemradio"
                aria-checked={c === currency}
                onClick={() => switchCurrency(c)}
                className={`flex items-center justify-between w-full h-9 px-3 rounded-xl text-sm transition-colors ${
                  c === currency ? "bg-neutral-900 text-white font-semibold" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span>{c} <span className={c === currency ? "text-white/70" : "text-neutral-400"}>· {CURRENCY_META[c].label}</span></span>
                <span className={`text-[13px] font-semibold ${c === currency ? "text-white/90" : "text-neutral-500"}`}>{CURRENCY_META[c].symbol}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
