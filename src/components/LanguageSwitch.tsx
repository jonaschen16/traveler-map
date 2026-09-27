"use client";

import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import { useI18n } from "@/i18n/client";

export default function LanguageSwitch() {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await setLocale(locale === "zh-TW" ? "en" : "zh-TW");
          // Full reload: Google Maps fixes its language when the script loads.
          window.location.reload();
        })
      }
      disabled={pending}
      className="shrink-0 text-sm text-gray-600 hover:underline disabled:opacity-50"
    >
      {t.header.switchLanguage}
    </button>
  );
}
