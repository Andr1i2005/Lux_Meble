"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

const INPUT = "w-full h-11 px-3.5 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Card number ───────────────────────────────────────────────────────────────

/** Strip non-digits, cap at 19, regroup into blocks of 4 separated by spaces. */
function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function CardBrand({ value }: { value: string }) {
  const d = value.replace(/\D/g, "");
  if (d.startsWith("4")) return <span className="text-[11px] font-extrabold tracking-wide text-blue-600 italic">VISA</span>;
  if (/^(5[1-5]|2[2-7])/.test(d)) {
    return (
      <span className="flex items-center" aria-label="Mastercard">
        <span className="w-4 h-4 rounded-full bg-red-500" />
        <span className="w-4 h-4 rounded-full bg-amber-400 -ml-2 mix-blend-multiply" />
      </span>
    );
  }
  if (/^3[47]/.test(d)) return <span className="text-[11px] font-extrabold tracking-wide text-sky-700">AMEX</span>;
  return (
    <svg width="22" height="16" viewBox="0 0 24 16" fill="none" aria-hidden>
      <rect x="0.6" y="0.6" width="22.8" height="14.8" rx="2.5" stroke="currentColor" strokeWidth="1.2" className="text-neutral-300" />
      <rect x="0.6" y="3.5" width="22.8" height="3" className="fill-neutral-200" />
    </svg>
  );
}

function CardNumberField() {
  const t = useTranslations("payment");
  const [value, setValue] = useState("");
  return (
    <label className="block sm:col-span-2">
      <span className="text-xs font-medium text-neutral-600">{t("cardNumber")}</span>
      <div className="relative mt-1">
        <input
          name="card"
          value={value}
          onChange={(e) => setValue(formatCardNumber(e.target.value))}
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          required
          className={`${INPUT} pr-14 tabular-nums tracking-[0.04em]`}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <CardBrand value={value} />
        </span>
      </div>
    </label>
  );
}

// ── Expiry month/year picker ──────────────────────────────────────────────────

function ExpiryPicker() {
  const t = useTranslations("payment");
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-11

  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<number | null>(null); // 1-12
  const [year, setYear] = useState<number | null>(null);   // full year
  const [viewYear, setViewYear] = useState(curYear);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const display = month && year ? `${String(month).padStart(2, "0")} / ${String(year).slice(2)}` : "";

  // Close on outside click / Escape while open.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openPicker() {
    setViewYear(year ?? curYear);
    // Flip to whichever side has more room (popover ≈ 280px tall).
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const POPOVER_H = 280;
      const below = window.innerHeight - rect.bottom;
      const above = rect.top;
      setPlacement(below < POPOVER_H && above > below ? "top" : "bottom");
    }
    setOpen(true);
  }

  function pick(monthIndex: number) {
    setMonth(monthIndex + 1);
    setYear(viewYear);
    setOpen(false);
  }

  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-600">{t("expiry")}</span>
      <div className="relative mt-1">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? setOpen(false) : openPicker())}
          className={`${INPUT} flex items-center justify-between text-left ${open ? "border-neutral-900" : ""} ${display ? "text-neutral-900" : "text-neutral-400"}`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className="tabular-nums">{display || "MM / YY"}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-400">
            <rect x="3" y="4.5" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3 9h18M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {/* submitted value */}
        <input type="hidden" name="expiry" value={display} />

        <AnimatePresence>
          {open && (
            <motion.div
              ref={popRef}
              initial={{ opacity: 0, y: placement === "top" ? 6 : -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: placement === "top" ? 6 : -6, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className={`absolute z-40 left-0 w-64 rounded-2xl border border-neutral-100 bg-white shadow-xl p-3 ${
                placement === "top" ? "bottom-full mb-2 origin-bottom" : "top-full mt-2 origin-top"
              }`}
              role="dialog"
            >
                {/* Year stepper */}
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => Math.max(curYear, y - 1))}
                    disabled={viewYear <= curYear}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    aria-label={t("prevYear")}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <span className="text-sm font-semibold text-neutral-900 tabular-nums">{viewYear}</span>
                  <button
                    type="button"
                    onClick={() => setViewYear((y) => Math.min(curYear + 15, y + 1))}
                    disabled={viewYear >= curYear + 15}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    aria-label={t("nextYear")}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>

                {/* Month grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS.map((m, idx) => {
                    const disabled = viewYear === curYear && idx < curMonth;
                    const selected = month === idx + 1 && year === viewYear;
                    return (
                      <motion.button
                        key={m}
                        type="button"
                        disabled={disabled}
                        whileTap={disabled ? undefined : { scale: 0.94 }}
                        onClick={() => pick(idx)}
                        className={`h-9 rounded-lg text-xs font-medium transition-colors ${
                          selected ? "bg-neutral-900 text-white"
                          : disabled ? "text-neutral-300 cursor-not-allowed"
                          : "text-neutral-700 hover:bg-neutral-100"
                        }`}
                      >
                        {m}
                      </motion.button>
                    );
                  })}
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </label>
  );
}

// ── CVC ───────────────────────────────────────────────────────────────────────

function CvcField() {
  const t = useTranslations("payment");
  const [value, setValue] = useState("");
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-600">{t("cvc")}</span>
      <input
        name="cvc"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        autoComplete="cc-csc"
        placeholder="123"
        required
        className={`${INPUT} mt-1 tabular-nums`}
      />
    </label>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export default function PaymentFields() {
  const t = useTranslations("payment");
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <CardNumberField />
        <ExpiryPicker />
        <CvcField />
      </div>
      <p className="text-[11px] text-neutral-400 mt-3">{t("demoNote")}</p>
    </>
  );
}
