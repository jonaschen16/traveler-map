import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { dictionaries } from "./dictionaries";

// Chosen language (cookie) first, then the browser's Accept-Language.
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  const accept = (await headers()).get("accept-language") ?? "";
  const first = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("zh")) return "zh-TW";
  if (first) return "en";
  return defaultLocale;
});

export async function getDictionary() {
  return dictionaries[await getLocale()];
}
