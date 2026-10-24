"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useCartStore, cartSubtotal, type CartItem } from "@/store/cart-store";
import { useOrderActions } from "@/lib/use-orders";
import { useHydrated } from "@/lib/use-hydrated";
import { assetUrl } from "@/lib/asset-url";
import Price from "./Price";
import { useAuth } from "./AuthProvider";
import AuthWall from "./AuthWall";
import PaymentFields from "./PaymentFields";

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      <input
        {...props}
        className="mt-1 w-full h-11 px-3.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-neutral-100 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-neutral-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Confirmation({ orderId, items, total }: { orderId: string; items: CartItem[]; total: number }) {
  const t = useTranslations("checkout");
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-6">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M7 14.5l4.5 4.5L21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{t("confirmedTitle")}</h1>
      <p className="text-sm text-neutral-500 mt-2">
        {t.rich("confirmedText", {
          id: orderId,
          b: (chunks) => <span className="font-semibold text-neutral-800">{chunks}</span>,
        })}
      </p>
      <div className="mt-6 text-left border border-neutral-100 rounded-2xl divide-y divide-neutral-100">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-neutral-700">{i.name} <span className="text-neutral-400">×{i.qty}</span></span>
            <span className="text-sm font-semibold tabular-nums"><Price value={i.unitPrice * i.qty} /></span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-bold">{t("total")}</span>
          <span className="text-base font-bold tabular-nums"><Price value={total} /></span>
        </div>
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href={`/orders/${orderId}`} className="inline-flex px-6 h-11 items-center justify-center rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          {t("trackOrder")}
        </Link>
        <Link href="/catalog" className="inline-flex px-6 h-11 items-center justify-center rounded-full border border-neutral-200 text-sm font-semibold text-neutral-900 hover:border-neutral-400 transition-colors">
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutClient() {
  const t = useTranslations("checkout");
  const hydrated = useHydrated();
  const { items, clear } = useCartStore();
  const { placeOrder } = useOrderActions();
  const { enabled, ready, user } = useAuth();
  const list = hydrated ? items : [];
  const subtotal = cartSubtotal(list);

  const [confirmation, setConfirmation] = useState<{ orderId: string; items: CartItem[]; total: number } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show a sticky mobile/tablet CTA bar whenever the real summary button is
  // off-screen (below the fold, or scrolled past).
  const ctaRef = useRef<HTMLButtonElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [confirmation, list.length, enabled, ready, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (list.length === 0 || placing) return;

    const fd = new FormData(e.target as HTMLFormElement);
    const str = (k: string) => (fd.get(k) as string | null)?.trim() ?? "";

    setPlacing(true);
    setError(null);
    let order;
    try {
      order = await placeOrder({
      email: str("email") || "you@example.com",
      total: subtotal,
      shipping: {
        name: [str("firstName"), str("lastName")].filter(Boolean).join(" ") || "Customer",
        address: str("address"),
        city: str("city"),
        postal: str("postal"),
        country: str("country") || "Ukraine",
      },
      items: list.map((i) => ({
        name: i.name,
        configLabel: i.configLabel,
        qty: i.qty,
        unitPrice: i.unitPrice,
        thumbnail: i.thumbnail,
        accentColor: i.accentColor,
      })),
      });
    } catch (err) {
      const code = (err as { code?: string; message?: string })?.code ?? "";
      const denied = code.includes("PERMISSION_DENIED") || (err as Error)?.message?.includes("permission");
      setError(denied ? t("errorDenied") : t("errorGeneric"));
      console.error("Place order failed:", err);
      setPlacing(false);
      return;
    }

    setConfirmation({ orderId: order.id, items: list, total: subtotal });
    clear();
    setPlacing(false);
  }

  if (confirmation) {
    return <Confirmation {...confirmation} />;
  }

  if (hydrated && list.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 px-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{t("emptyTitle")}</h1>
        <p className="text-sm text-neutral-500 mt-2 mb-6">{t("emptyText")}</p>
        <Link href="/catalog" className="inline-flex px-6 h-11 items-center rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
          {t("browseFurniture")}
        </Link>
      </div>
    );
  }

  // Sign-up wall: with Firebase enabled, an account is required to place an order
  // (orders are saved under the user and tracked in realtime). Guest mode — when
  // Firebase isn't configured — skips this and keeps orders in localStorage.
  if (enabled && !ready) {
    return <div className="max-w-lg mx-auto py-24 text-center text-sm text-neutral-400">Loading…</div>;
  }
  if (enabled && !user) {
    return <AuthWall />;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-10">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mb-8">{t("title")}</h1>
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* Form */}
        <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Section title={t("contact")}>
            <Field label={t("email")} type="email" name="email" placeholder="you@example.com" required autoComplete="email" defaultValue={user?.email ?? undefined} />
          </Section>

          <Section title={t("shippingAddress")}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t("firstName")} name="firstName" placeholder="Anna" required autoComplete="given-name" />
              <Field label={t("lastName")} name="lastName" placeholder="Kovalenko" required autoComplete="family-name" />
              <div className="sm:col-span-2"><Field label={t("address")} name="address" placeholder="Street and number" required autoComplete="street-address" /></div>
              <Field label={t("city")} name="city" placeholder="Kyiv" required autoComplete="address-level2" />
              <Field label={t("postal")} name="postal" placeholder="01001" required autoComplete="postal-code" />
              <div className="sm:col-span-2"><Field label={t("country")} name="country" placeholder="Ukraine" required autoComplete="country-name" /></div>
            </div>
          </Section>

          <Section title={t("payment")}>
            <PaymentFields />
          </Section>
        </form>

        {/* Summary */}
        <aside className="border border-neutral-100 rounded-2xl p-5 lg:sticky lg:top-24">
          <h2 className="text-sm font-bold text-neutral-900 mb-4">{t("summary")}</h2>
          <div className="flex flex-col gap-4 max-h-72 overflow-y-auto">
            {list.map((i) => (
              <div key={i.id} className="flex gap-3">
                <div className="w-16 h-16 rounded-xl shrink-0 overflow-hidden flex items-center justify-center" style={{ background: `${i.accentColor}14` }}>
                  {i.thumbnail
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={assetUrl(i.thumbnail)} alt={i.name} className="w-full h-full object-contain" />
                    : <span className="w-9 h-4 rounded-md" style={{ background: i.accentColor }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{i.name} <span className="text-neutral-400 font-medium">×{i.qty}</span></p>
                  <p className="text-[11px] text-neutral-500 leading-snug">{i.configLabel}</p>
                  <p className="text-sm font-semibold tabular-nums mt-1"><Price value={i.unitPrice * i.qty} /></p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-100 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-neutral-500">{t("subtotal")}</span><span className="font-semibold tabular-nums"><Price value={subtotal} /></span></div>
            <div className="flex justify-between text-sm"><span className="text-neutral-500">{t("shipping")}</span><span className="font-semibold text-neutral-700">{t("free")}</span></div>
            <div className="flex justify-between text-base pt-2 border-t border-neutral-100"><span className="font-bold">{t("total")}</span><span className="font-bold tabular-nums"><Price value={subtotal} /></span></div>
          </div>

          {error && (
            <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 leading-relaxed">
              {error}
            </p>
          )}

          <button ref={ctaRef} type="submit" form="checkout-form" disabled={placing} className="w-full h-12 mt-5 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {placing ? t("placing") : t("placeOrder")}
          </button>
          <Link href="/catalog" className="block text-center text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors mt-3">
            {t("continueShopping")}
          </Link>
        </aside>
      </div>

      {/* Sticky mobile/tablet checkout bar — slides in when the summary CTA is off-screen */}
      <AnimatePresence>
        {!ctaVisible && list.length > 0 && (
          <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_28px_-14px_rgba(0,0,0,0.28)]"
          >
            <div className="max-w-6xl mx-auto flex items-center gap-3">
              {/* Item thumbnails */}
              <div className="flex -space-x-2 shrink-0">
                {list.slice(0, 3).map((i) => (
                  <span key={i.id} className="w-9 h-9 rounded-lg border-2 border-white overflow-hidden flex items-center justify-center bg-neutral-50" style={{ background: `${i.accentColor}14` }}>
                    {i.thumbnail
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={assetUrl(i.thumbnail)} alt="" className="w-full h-full object-contain" />
                      : <span className="w-4 h-2 rounded" style={{ background: i.accentColor }} />}
                  </span>
                ))}
                {list.length > 3 && (
                  <span className="w-9 h-9 rounded-lg border-2 border-white bg-neutral-100 text-neutral-600 text-[11px] font-bold flex items-center justify-center tabular-nums">
                    +{list.length - 3}
                  </span>
                )}
              </div>

              <div className="min-w-0 shrink-0">
                <p className="text-[11px] text-neutral-500 leading-none">{t("total")}</p>
                <p className="text-base font-bold tabular-nums leading-tight"><Price value={subtotal} /></p>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={placing}
                className="ml-auto shrink-0 h-11 px-6 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {placing ? t("placing") : t("placeOrder")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
