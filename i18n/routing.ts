import { defineRouting } from "next-intl/routing";

// EN (default) served at `/`, others prefixed: `/pl`, `/uk` (Ukrainian ISO = uk).
export const routing = defineRouting({
  locales: ["en", "pl", "uk"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  pl: "Polski",
  uk: "Українська",
};

export const localeShort: Record<Locale, string> = {
  en: "EN",
  pl: "PL",
  uk: "UA",
};
