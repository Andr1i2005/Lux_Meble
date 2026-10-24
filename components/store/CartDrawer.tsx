"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore, cartSubtotal } from "@/store/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { assetUrl } from "@/lib/asset-url";
import Price from "./Price";

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Stepper({ qty, onChange }: { qty: number; onChange: (q: number) => void }) {
  const t = useTranslations("cart");
  return (
    <div className="inline-flex items-center rounded-full border border-neutral-200">
      <button
        onClick={() => onChange(qty - 1)}
        className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
        aria-label={t("decrease")}
      >
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
      <span className="w-6 text-center text-xs font-semibold tabular-nums">{qty}</span>
      <button
        onClick={() => onChange(qty + 1)}
        className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors"
        aria-label={t("increase")}
      >
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

export default function CartDrawer() {
  const t = useTranslations("cart");
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, isOpen, closeCart, setQty, removeItem } = useCartStore();
  const list = hydrated ? items : [];
  const subtotal = cartSubtotal(list);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl flex flex-col"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-100 shrink-0">
              <h2 className="text-sm font-bold tracking-tight">
                {t("title")} <span className="text-neutral-400 font-medium">({list.reduce((n, i) => n + i.qty, 0)})</span>
              </h2>
              <button onClick={closeCart} className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 transition-colors" aria-label={t("close")}>
                <IconClose />
              </button>
            </div>

            {list.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4 text-neutral-400">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 7h13l-1.2 9.2a2 2 0 01-2 1.8H9.2a2 2 0 01-2-1.8L6 4H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <p className="text-sm font-semibold text-neutral-800">{t("emptyTitle")}</p>
                <p className="text-xs text-neutral-500 mt-1 mb-5">{t("emptyHint")}</p>
                <Link href="/catalog" onClick={closeCart} className="text-xs font-semibold px-4 py-2.5 rounded-full bg-neutral-900 text-white hover:opacity-90 transition-opacity">
                  {t("browseFurniture")}
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                  {list.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <Link
                        href={`/configurator/${item.slug}?${item.configQuery}`}
                        onClick={closeCart}
                        className="w-20 h-20 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
                        style={{ background: `${item.accentColor}14` }}
                      >
                        {item.thumbnail
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={assetUrl(item.thumbnail)} alt={item.name} className="w-full h-full object-contain" />
                          : <span className="w-10 h-5 rounded-md" style={{ background: item.accentColor }} />}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-neutral-900 leading-tight truncate">{item.name}</p>
                          <button onClick={() => removeItem(item.id)} className="text-neutral-300 hover:text-neutral-700 transition-colors shrink-0" aria-label={t("remove")}>
                            <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">{item.configLabel}</p>
                        <div className="flex items-center justify-between mt-2.5">
                          <Stepper qty={item.qty} onChange={(q) => setQty(item.id, q)} />
                          <span className="text-sm font-semibold tabular-nums"><Price value={item.unitPrice * item.qty} /></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutral-100 px-5 py-4 shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-neutral-500">{t("subtotal")}</span>
                    <span className="text-base font-bold tabular-nums"><Price value={subtotal} /></span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mb-4">{t("shippingNote")}</p>
                  <button
                    onClick={() => { closeCart(); router.push("/checkout"); }}
                    className="w-full h-11 rounded-full bg-neutral-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t("checkout")}
                  </button>
                  <button onClick={closeCart} className="w-full mt-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors py-1">
                    {t("continueShopping")}
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
