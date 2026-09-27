"use client";

import { useEffect, useRef } from "react";
import { isFacebookVideo } from "@/lib/url";

declare global {
  interface Window {
    FB?: { XFBML: { parse: (el?: Element) => void } };
  }
}

const SDK_URL = "https://connect.facebook.net/zh_TW/sdk.js#xfbml=1&version=v25.0";
let sdk: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  sdk ??= new Promise((resolve, reject) => {
    if (!document.getElementById("fb-root")) {
      const root = document.createElement("div");
      root.id = "fb-root";
      document.body.prepend(root);
    }
    const script = document.createElement("script");
    script.src = SDK_URL;
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadSdk()
      .then(() => {
        if (!cancelled && ref.current) window.FB?.XFBML.parse(ref.current);
      })
      .catch(() => {
        // The fallback link below still works.
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

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
        在 Facebook 查看 ↗
      </a>
    </div>
  );
}
