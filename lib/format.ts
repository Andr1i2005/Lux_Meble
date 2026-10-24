/** Format a number as a EUR price using Ukrainian grouping, e.g. "2 519 €". */
export function formatPrice(value: number): string {
  return `${value.toLocaleString("uk-UA")} €`;
}

// Map app locales to BCP-47 tags for Intl. Defaults to en-GB.
const INTL_LOCALE: Record<string, string> = { en: "en-GB", pl: "pl-PL", uk: "uk-UA" };
function intlLocale(locale?: string): string {
  return (locale && INTL_LOCALE[locale]) ?? "en-GB";
}

/** "Tue, 1 Jul" (localized) */
export function formatDate(ms: number, locale?: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", day: "numeric", month: "short" }).format(ms);
}

/** "1 Jul, 14:32" (localized) */
export function formatDateTime(ms: number, locale?: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(ms);
}

/** Relative-ish label: "Just now", "2h ago", "3d ago", or a date. */
export function formatRelative(ms: number, now: number): string {
  const diff = now - ms;
  if (diff < 0) return formatDate(ms);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(ms);
}
