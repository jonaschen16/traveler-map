import "server-only";
import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

// Fetching user-supplied URLs on the server: block anything that resolves to
// a private / loopback / link-local address so the site can't be used to
// probe internal networks (SSRF). A DNS answer could still change between
// our lookup and fetch's own lookup; that residual risk is accepted here.

const blocked = new BlockList();
for (const [net, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 3],
] as const) {
  blocked.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
] as const) {
  blocked.addSubnet(net, prefix, "ipv6");
}

function isBlockedAddress(address: string): boolean {
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return blocked.check(mapped[1], "ipv4");
  return blocked.check(address, isIP(address) === 6 ? "ipv6" : "ipv4");
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("bad protocol");
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("bad port");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isBlockedAddress(a.address))) {
    throw new Error("blocked address");
  }
}

const TIMEOUT_MS = 6000;
const MAX_REDIRECTS = 4;
const MAX_BYTES = 1_000_000;

// fetch() with redirects followed manually so every hop is checked.
async function safeFetch(start: URL, userAgent: string): Promise<{ res: Response; url: URL }> {
  let url = start;
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal,
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
      },
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel();
      url = new URL(location, url);
      continue;
    }
    return { res, url };
  }
  throw new Error("too many redirects");
}

async function readLimited(res: Response): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.byteLength;
  }
  await reader.cancel();
  const out = new Uint8Array(Math.min(size, MAX_BYTES));
  let offset = 0;
  for (const chunk of chunks) {
    const part = chunk.subarray(0, out.length - offset);
    out.set(part, offset);
    offset += part.length;
    if (offset >= out.length) break;
  }
  return out;
}

// Many Taiwanese sites still serve Big5, so honor the declared charset.
function decodeHtml(bytes: Uint8Array, contentType: string | null): string {
  const sniff = new TextDecoder("latin1").decode(bytes.subarray(0, 4096));
  const charset =
    contentType?.match(/charset=["']?([\w-]+)/i)?.[1] ??
    sniff.match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1] ??
    "utf-8";
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function clean(value: string | undefined, max: number): string | null {
  if (!value) return null;
  const text = decodeEntities(value).replace(/\s+/g, " ").trim();
  return text ? text.slice(0, max) : null;
}

function parseMeta(html: string): Record<string, string> {
  const headEnd = html.search(/<\/head>/i);
  const head = html.slice(0, headEnd >= 0 ? headEnd : 300_000);
  const meta: Record<string, string> = {};
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? "";
    }
    const key = (attrs.property ?? attrs.name ?? attrs.itemprop)?.toLowerCase();
    if (key && attrs.content && !(key in meta)) meta[key] = attrs.content;
  }
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (title) meta["<title>"] = title;
  return meta;
}

export type LinkPreview = {
  preview_title: string | null;
  preview_description: string | null;
  preview_image: string | null;
  preview_site_name: string | null;
};

export async function fetchLinkPreview(url: URL): Promise<LinkPreview> {
  const { res, url: finalUrl } = await safeFetch(
    url,
    "Mozilla/5.0 (compatible; TravelerMapBot/1.0; link preview)",
  );
  const empty: LinkPreview = {
    preview_title: null,
    preview_description: null,
    preview_image: null,
    preview_site_name: url.hostname.replace(/^www\./, ""),
  };
  if (!res.ok || !res.headers.get("content-type")?.includes("html")) {
    await res.body?.cancel();
    return empty;
  }

  const html = decodeHtml(await readLimited(res), res.headers.get("content-type"));
  const m = parseMeta(html);

  let image: string | null = null;
  const rawImage = m["og:image:secure_url"] ?? m["og:image"] ?? m["twitter:image"];
  if (rawImage) {
    try {
      const abs = new URL(decodeEntities(rawImage), finalUrl);
      abs.protocol = "https:"; // only https images are stored (and shown)
      if (abs.href.length <= 2048) image = abs.href;
    } catch {
      // ignore unparsable image URLs
    }
  }

  return {
    preview_title: clean(m["og:title"] ?? m["twitter:title"] ?? m["<title>"], 300),
    preview_description: clean(
      m["og:description"] ?? m["twitter:description"] ?? m["description"],
      1000,
    ),
    preview_image: image,
    preview_site_name: clean(m["og:site_name"], 100) ?? empty.preview_site_name,
  };
}

// facebook.com/share/... links redirect to the real post; the embed plugin
// needs the real permalink. Falls back to the original URL.
export async function resolveFacebookUrl(url: URL): Promise<string> {
  if (!/^\/share\//.test(url.pathname) && url.hostname !== "fb.watch") return url.href;
  try {
    const { res, url: finalUrl } = await safeFetch(url, "facebookexternalhit/1.1");
    await res.body?.cancel();
    const ok = /(^|\.)facebook\.com$/i.test(finalUrl.hostname) && !/^\/login/.test(finalUrl.pathname);
    return ok ? finalUrl.href : url.href;
  } catch {
    return url.href;
  }
}
