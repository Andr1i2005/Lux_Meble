"use client";

import { useCurrencyStore, formatMoney } from "@/store/currency-store";
import { useHydrated } from "@/lib/use-hydrated";

/**
 * Displays a EUR amount in the user's selected currency. Renders EUR on the
 * server / first client render (the default) and switches after hydration, so
 * there's no hydration mismatch.
 */
export default function Price({ value }: { value: number }) {
  const hydrated = useHydrated();
  const currency = useCurrencyStore((s) => s.currency);
  return <>{formatMoney(value, hydrated ? currency : "EUR")}</>;
}
