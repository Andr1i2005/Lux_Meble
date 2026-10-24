"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useOrder, useOrderActions } from "@/lib/use-orders";
import { useHydrated } from "@/lib/use-hydrated";
import { getOrderProgress } from "@/lib/order-tracking";
import { formatDate, formatDateTime } from "@/lib/format";
import { assetUrl } from "@/lib/asset-url";
import Price from "./Price";
import { useAuth } from "./AuthProvider";
import AuthWall from "./AuthWall";

const MILESTONES = ["confirmed", "production", "shipped", "out", "delivered"] as const;

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M2.5 6.5h11v9h-11v-9zM13.5 9.5h4l3 3v3h-7v-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="6.5" cy="17.5" r="1.7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="17.5" r="1.7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function OrderTracking({ orderId }: { orderId: string }) {
  const t = useTranslations("tracking");
  const tStages = useTranslations("stages");
  const locale = useLocale();
  const hydrated = useHydrated();
  const { enabled, ready, user } = useAuth();
  const { order, loading } = useOrder(orderId);
  const { advance, reset } = useOrderActions();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const [copied, setCopied] = useState(false);

  const progress = useMemo(
    () => (order ? getOrderProgress(order, now) : null),
    [order, now],
  );

  if (enabled && ready && !user) {
    return (
      <AuthWall variant="tracking" />
    );
  }

  if (!hydrated || loading) {
    return <div className="max-w-4xl mx-auto px-6 py-20 text-sm text-neutral-400">{t("loadingOrder")}</div>;
  }

  if (!order || !progress) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 px-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{t("notFoundTitle")}</h1>
        <p className="text-sm text-neutral-500 mt-2 mb-6">
          {t.rich("notFoundText", {
            id: orderId,
            b: () => <span className="font-semibold text-neutral-700">{orderId}</span>,
          })}
        </p>
        <Link href="/orders" className="inline-flex px-6 h-11 items-center rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          {t("viewAll")}
        </Link>
      </div>
    );
  }

  const stageByKey = Object.fromEntries(progress.stages.map((s) => [s.key, s]));
  const timeline = [...progress.stages].reverse();

  function copyTracking() {
    navigator.clipboard?.writeText(order!.trackingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <main className="max-w-4xl mx-auto px-6 md:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-neutral-400 mb-6 flex items-center gap-1.5">
        <Link href="/orders" className="hover:text-neutral-700 transition-colors">{t("breadcrumb")}</Link>
        <span>/</span>
        <span className="text-neutral-600 tabular-nums">{order.id}</span>
      </nav>

      {/* Status header */}
      <div className="rounded-3xl border border-neutral-100 bg-white p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full ${
              progress.delivered ? "bg-emerald-50 text-emerald-700" : "bg-neutral-900 text-white"
            }`}>
              {!progress.delivered && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              {progress.delivered ? t("delivered") : t("onTheWay")}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-3">
              {tStages(`${progress.stages[progress.currentIndex]?.key ?? "placed"}.label`)}
            </h1>
            <p className="text-sm font-medium text-neutral-800 mt-1">
              {progress.delivered
                ? t("deliveredOn", { date: formatDate(progress.eta, locale) })
                : t("estDelivery", { date: formatDate(progress.eta, locale) })}
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">{t("order")}</p>
            <p className="text-sm font-bold text-neutral-900 tabular-nums">{order.id}</p>
            <p className="text-[11px] text-neutral-400 mt-1.5">{t("placed", { date: formatDate(order.createdAt, locale) })}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${progress.delivered ? "bg-emerald-500" : "bg-neutral-900"}`}
              initial={false}
              animate={{ width: `${progress.percent}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 24 }}
            />
          </div>

          {/* Milestone stepper */}
          <div className="grid grid-cols-5 gap-1 mt-4">
            {MILESTONES.map((key) => {
              const st = stageByKey[key];
              const done = st?.done;
              const current = st?.current;
              return (
                <div key={key} className="flex flex-col items-center text-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                    done ? "bg-neutral-900 text-white"
                    : current ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                    : "bg-neutral-100 text-neutral-300"
                  }`}>
                    {done ? <CheckIcon /> : current ? <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> : ""}
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-medium leading-tight ${done || current ? "text-neutral-700" : "text-neutral-300"}`}>
                    {t(`milestones.${key}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shipment route */}
      <div className="rounded-3xl border border-neutral-100 bg-white p-6 mt-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400">{t("shipment")}</p>
            <p className="text-sm font-semibold text-neutral-900 mt-0.5">{order.carrier}</p>
          </div>
          <button
            onClick={copyTracking}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-full px-3 h-8 hover:border-neutral-400 transition-colors"
          >
            <span className="tabular-nums">{order.trackingNumber}</span>
            {copied ? <span className="text-emerald-600">{t("copied")}</span> : <span className="text-neutral-400">{t("copy")}</span>}
          </button>
        </div>

        {/* Route line with moving marker */}
        <div className="relative h-1.5 rounded-full bg-neutral-100 mx-1">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-neutral-900"
            initial={false}
            animate={{ width: `${progress.percent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 24 }}
          />
          <motion.div
            className="absolute -top-3.5 w-9 h-9 -ml-[18px] rounded-full bg-white border border-neutral-200 shadow-md flex items-center justify-center text-neutral-900"
            initial={false}
            animate={{ left: `${progress.percent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 24 }}
          >
            {progress.delivered ? <CheckIcon size={15} /> : <TruckIcon />}
          </motion.div>
        </div>
        <div className="flex justify-between mt-4 text-[11px]">
          <span className="font-medium text-neutral-700">Kraków, PL</span>
          <span className="text-neutral-400">{order.shipping.city}, {order.shipping.country}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4 mt-4 items-start">
        {/* Detailed event timeline */}
        <div className="rounded-3xl border border-neutral-100 bg-white p-6">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-5">{t("history")}</p>
          <ol className="relative">
            {timeline.map((s, i) => {
              const reached = s.done || s.current;
              const isLastRow = i === timeline.length - 1;
              return (
                <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* rail */}
                  {!isLastRow && (
                    <span className={`absolute left-[11px] top-6 bottom-0 w-px ${reached ? "bg-neutral-200" : "bg-neutral-100"}`} />
                  )}
                  <span className={`relative z-10 shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                    s.current ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                    : s.done ? "bg-neutral-900 text-white"
                    : "bg-white border-2 border-neutral-200 text-transparent"
                  }`}>
                    {s.done ? <CheckIcon size={11} /> : s.current ? <span className="w-1.5 h-1.5 rounded-full bg-white" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={`text-sm font-semibold ${reached ? "text-neutral-900" : "text-neutral-400"}`}>{tStages(`${s.key}.label`)}</p>
                      <p className={`text-[11px] shrink-0 tabular-nums ${reached ? "text-neutral-500" : "text-neutral-300"}`}>
                        {reached ? formatDateTime(s.date, locale) : t("est", { date: formatDate(s.date, locale) })}
                      </p>
                    </div>
                    <p className={`text-xs mt-0.5 ${reached ? "text-neutral-500" : "text-neutral-300"}`}>{tStages(`${s.key}.description`)}</p>
                    <p className={`text-[11px] mt-1 ${reached ? "text-neutral-400" : "text-neutral-300"}`}>{tStages(`${s.key}.location`)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Side: items + address */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-neutral-100 bg-white p-5">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-3">{t("items")}</p>
            <div className="flex flex-col gap-3">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center bg-neutral-50" style={{ background: `${it.accentColor}12` }}>
                    {it.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={assetUrl(it.thumbnail)} alt={it.name} className="w-full h-full object-contain" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{it.name} <span className="text-neutral-400 font-medium">×{it.qty}</span></p>
                    <p className="text-[11px] text-neutral-500 leading-snug truncate">{it.configLabel}</p>
                  </div>
                  <span className="text-xs font-semibold tabular-nums"><Price value={it.unitPrice * it.qty} /></span>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-100 mt-4 pt-3 flex justify-between text-sm">
              <span className="font-bold">{t("total")}</span>
              <span className="font-bold tabular-nums"><Price value={order.total} /></span>
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-100 bg-white p-5">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-3">{t("deliveryAddress")}</p>
            <p className="text-sm font-semibold text-neutral-900">{order.shipping.name}</p>
            <p className="text-sm text-neutral-500 leading-relaxed mt-0.5">
              {order.shipping.address}<br />
              {order.shipping.postal} {order.shipping.city}<br />
              {order.shipping.country}
            </p>
          </div>
        </aside>
      </div>

      {/* Demo controls */}
      <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-neutral-500">
          <span className="font-semibold text-neutral-700">{t("fulfilment")}</span> — {t("fulfilmentNote")}
        </p>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { void advance(order.id); }}
            disabled={progress.delivered}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-neutral-900 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {t("advance")}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { void reset(order.id); }}
            className="inline-flex items-center h-9 px-4 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-700 hover:border-neutral-400 transition-colors"
          >
            {t("reset")}
          </motion.button>
        </div>
      </div>
    </main>
  );
}
