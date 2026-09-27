"use client";

import { useEffect, useRef } from "react";
import { isFacebookVideo } from "@/lib/url";
import { useI18n } from "@/i18n/client";

declare global {
  interface Window {
    FB?: { XFBML: { parse: (el?: Element) => void } };
  }
}

let sdk: Promise<void> | null = null;

// Loaded once per page load; switching language reloads the page.
function loadSdk(locale: string): Promise<void> {
  sdk ??= new Promise((resolve, reject) => {
    if (!document.getElementById("fb-root")) {
      const root = document.createElement("div");
      root.id = "fb-root";
      document.body.prepend(root);
    }
    const script = document.createElement("script");
    const fbLocale = locale === "en" ? "en_US" : "zh_TW";
    script.src = `https://connect.facebook.net/${fbLocale}/sdk.js#xfbml=1&version=v25.0`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => {
      sdk = null;
      reject(new Error("Facebook SDK failed to load"));
    };
    document.body.appendChild(script);
  });
  return sdk;
}

// Official Facebook embed. Only public posts render; for anything else the
// plugin shows nothing, so a plain link is always shown underneath.
export default function FacebookEmbed({ url }: { url: string }) {
  const { locale, t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadSdk(locale)
      .then(() => {
        if (!cancelled && ref.current) window.FB?.XFBML.parse(ref.current);
      })
      .catch(() => {
        // The fallback link below still works.
      });
    return () => {
      cancelled = true;
    };
  }, [url, locale]);

  return (
    <div>
      <div ref={ref} key={url} className="overflow-hidden">
        <div
          className={isFacebookVideo(url) ? "fb-video" : "fb-post"}
          data-href={url}
          data-show-text="true"
          data-lazy="true"
        />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="mt-1 inline-block text-sm text-blue-600 hover:underline"
      >
        {t.content.viewOnFacebook}
      </a>
    </div>
  );
}
