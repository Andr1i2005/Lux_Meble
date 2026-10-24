"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useOrders } from "@/lib/use-orders";
import { useHydrated } from "@/lib/use-hydrated";
import { getOrderProgress } from "@/lib/order-tracking";
import { formatDate } from "@/lib/format";
import { assetUrl } from "@/lib/asset-url";
import { useAuth } from "./AuthProvider";
import AuthWall from "./AuthWall";
import { FadeIn, Stagger, StaggerItem } from "./Motion";

export default function OrdersList() {
  const t = useTranslations("orders");
  const tStages = useTranslations("stages");
  const locale = useLocale();
  const hydrated = useHydrated();
  const { enabled, ready, user } = useAuth();
  const { orders, loading } = useOrders();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const id = query.trim();
    if (id) router.push(`/orders/${id.toUpperCase()}`);
  }

  // Orders live only in the user's account — require sign-in to view them.
  if (enabled && ready && !user) {
    return (
      <AuthWall variant="orders" />
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 md:px-8 py-10">
      <FadeIn className="mb-8">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-2">{t("eyebrow")}</p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">{t("title")}</h1>
        <p className="text-sm text-neutral-500 mt-2">{t("subtitle")}</p>
      </FadeIn>

      {/* Track by number */}
      <form onSubmit={handleTrack} className="flex gap-2 mb-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("trackPlaceholder")}
          className="flex-1 h-12 px-4 rounded-full border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
        />
        <button type="submit" className="h-12 px-6 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0">
          {t("track")}
        </button>
      </form>

      {!hydrated || loading ? (
        <div className="py-16 text-sm text-neutral-400">{t("loading")}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-200 rounded-3xl">
          <h2 className="text-lg font-bold text-neutral-900">{t("emptyTitle")}</h2>
          <p className="text-sm text-neutral-500 mt-1 mb-5">{t("emptyText")}</p>
          <Link href="/catalog" className="inline-flex px-6 h-11 items-center rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            {t("browseFurniture")}
          </Link>
        </div>
      ) : (
        <Stagger className="flex flex-col gap-3">
          {orders.map((o) => {
            const p = getOrderProgress(o, now);
            return (
              <StaggerItem key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="group block rounded-2xl border border-neutral-100 hover:border-neutral-300 hover:shadow-md transition-all p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        p.delivered ? "bg-emerald-50 text-emerald-700" : "bg-neutral-900 text-white"
                      }`}>
                        {!p.delivered && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />}
                        {p.delivered ? t("delivered") : tStages(`${p.stages[p.currentIndex]?.key ?? "placed"}.label`)}
                      </span>
                      <span className="text-sm font-bold text-neutral-900 tabular-nums">{o.id}</span>
                    </div>
                    <span className="text-xs text-neutral-400 shrink-0 hidden sm:block">{formatDate(o.createdAt, locale)}</span>
                  </div>

                  {/* mini progress */}
                  <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden mt-3">
                    <motion.div
                      className={`h-full rounded-full ${p.delivered ? "bg-emerald-500" : "bg-neutral-900"}`}
                      initial={false}
                      animate={{ width: `${p.percent}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 24 }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex -space-x-2">
                        {o.items.slice(0, 3).map((it, i) => (
                          <span key={i} className="w-8 h-8 rounded-lg border-2 border-white overflow-hidden flex items-center justify-center bg-neutral-50" style={{ background: `${it.accentColor}14` }}>
                            {it.thumbnail && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={assetUrl(it.thumbnail)} alt={it.name} className="w-full h-full object-contain" />
                            )}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-neutral-500 truncate">
                        {p.delivered ? t("deliveredOn", { date: formatDate(p.eta, locale) }) : t("arriving", { date: formatDate(p.eta, locale) })}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-neutral-900 shrink-0 group-hover:gap-2 transition-all">
                      {t("track")} <span>→</span>
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </main>
  );
}
