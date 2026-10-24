"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "./AuthProvider";

function errorKey(code: string): "cancelled" | "popupBlocked" | "tooMany" | "network" | "generic" {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request": return "cancelled";
    case "auth/popup-blocked": return "popupBlocked";
    case "auth/too-many-requests": return "tooMany";
    case "auth/network-request-failed": return "network";
    default: return "generic";
  }
}

export default function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const t = useTranslations("auth");
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err) {
      setError(t(`errors.${errorKey((err as { code?: string })?.code ?? "")}`));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="w-full h-12 rounded-full border border-neutral-200 bg-white flex items-center justify-center gap-3 text-sm font-semibold text-neutral-900 hover:border-neutral-400 disabled:opacity-50 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.71H.96v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.98 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.02-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
        </svg>
        {busy ? t("pleaseWait") : t("google")}
      </button>

      {error && <p className="text-xs text-red-600 text-center mt-4">{error}</p>}

      <p className="text-[11px] text-neutral-400 text-center mt-4">
        {t("disclaimer")}
      </p>
    </div>
  );
}
