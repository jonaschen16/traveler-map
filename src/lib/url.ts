export type ContentType = "facebook" | "link";

const FACEBOOK_HOST = /(^|\.)(facebook\.com|fb\.com|fb\.watch)$/i;

// Parse user input into an http(s) URL and decide how to display it.
export function classifyUrl(input: string): { url: URL; type: ContentType } | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.href.length > 2048) return null;

  return { url, type: FACEBOOK_HOST.test(url.hostname) ? "facebook" : "link" };
}

// Videos and reels use a different Facebook embed plugin than posts.
export function isFacebookVideo(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    return hostname === "fb.watch" || /\/(videos|reel|watch)\b/.test(pathname);
  } catch {
    return false;
  }
}
