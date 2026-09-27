export const locales = ["zh-TW", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "zh-TW";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

// Fill "{name}" placeholders. Dictionaries hold plain strings (not functions)
// so they can be passed from Server to Client Components.
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

export function formatDate(date: string | Date, locale: Locale): string {
  return new Date(date).toLocaleDateString(locale, { timeZone: "Asia/Taipei" });
}
