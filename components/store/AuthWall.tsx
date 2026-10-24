"use client";

import { useTranslations } from "next-intl";
import AuthForm from "./AuthForm";

type Variant = "checkout" | "orders" | "tracking";

/**
 * Sign-up wall shown before a gated action. `variant` selects the localized
 * copy (see messages `auth.wall.*`). `onSuccess` fires once authenticated so the
 * caller can reveal the gated content.
 */
export default function AuthWall({
  variant = "checkout",
  onSuccess,
}: {
  variant?: Variant;
  onSuccess?: () => void;
}) {
  const t = useTranslations("auth");
  const benefits = ["track", "reorder", "private"] as const;

  return (
    <div className="max-w-md mx-auto py-14 px-6">
      <div className="text-center mb-8">
        <span className="inline-flex w-12 h-12 rounded-full bg-neutral-900 text-white items-center justify-center mb-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="4" y="10.5" width="16" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{t(`wall.${variant}.title`)}</h1>
        <p className="text-sm text-neutral-500 mt-2">{t(`wall.${variant}.subtitle`)}</p>
      </div>

      <AuthForm onSuccess={onSuccess} />

      {/* Block hugs the widest item (w-fit); items cap at max-w-xs and wrap. */}
      <ul className="mt-8 flex flex-col gap-2.5 w-fit mx-auto">
        {benefits.map((key) => (
          <li key={key} className="flex items-start gap-2.5 max-w-xs text-xs text-neutral-500">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-px shrink-0 text-emerald-500" aria-hidden>
              <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t(`benefits.${key}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
