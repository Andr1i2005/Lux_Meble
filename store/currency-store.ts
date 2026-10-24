import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Prices are stored in EUR; other currencies are converted for display using the
// static rates below (this is a demo — swap for live rates if ever needed).
export type Currency = "EUR" | "PLN" | "UAH";

export const CURRENCY_META: Record<Currency, { symbol: string; rate: number; label: string }> = {
  EUR: { symbol: "€", rate: 1, label: "Euro" },
  PLN: { symbol: "zł", rate: 4.3, label: "Złoty" },
  UAH: { symbol: "₴", rate: 45, label: "Hryvnia" },
};

export const CURRENCIES = Object.keys(CURRENCY_META) as Currency[];

/** Convert a EUR amount into the target currency (rounded to a whole unit). */
export function convert(eur: number, currency: Currency): number {
  return Math.round(eur * CURRENCY_META[currency].rate);
}

/** Format a EUR amount in the target currency, e.g. "1 899 €", "8 166 zł". */
export function formatMoney(eur: number, currency: Currency): string {
  return `${convert(eur, currency).toLocaleString("uk-UA")} ${CURRENCY_META[currency].symbol}`;
}

interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: "EUR",
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: "luxmeble-currency",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
