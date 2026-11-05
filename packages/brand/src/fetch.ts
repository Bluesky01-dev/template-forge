import { parse as parseHtml } from "node-html-parser";
import type { SiteSnapshot } from "./analyze";

export interface FetchOptions {
  fetcher?: typeof fetch;
  maxStylesheets?: number;
  maxBytes?: number;
  timeoutMs?: number;
  /** DEV ONLY: allow localhost/private hosts (for testing against a local fixture site). */
  allowPrivate?: boolean;
}

const UA = "Mozilla/5.0 (compatible; TemplateForgeBot/1.0; +https://github.com/Bluesky01-dev/template-forge)";

async function getText(url: string, f: typeof fetch, maxBytes: number, timeoutMs: number): Promise<string> {
  const res = await f(url, {
    headers: { "user-agent": UA, accept: "text/html,text/css,*/*;q=0.8" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  const t = await res.text();
  return t.length > maxBytes ? t.slice(0, maxBytes) : t;
}

/** Only allow http(s) to public hosts (basic SSRF guard for a server-side fetcher). */
export function assertPublicUrl(raw: string, allowPrivate = false): URL {
  const u = new URL(raw);
  if (!/^https?:$/.test(u.protocol)) throw new Error("Only http(s) URLs are allowed");
  if (allowPrivate) return u;
  const h = u.hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    /^(127|10|0)\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    /^169\.254\./.test(h) ||
    h === "[::1]"
  )
    throw new Error("Private addresses are not allowed");
  return u;
}

/** Fetch a page and its linked stylesheets (static fetch; works on Workers and Node). */
export async function fetchSite(url: string, opts: FetchOptions = {}): Promise<SiteSnapshot> {
  const f = opts.fetcher ?? fetch;
  const maxBytes = opts.maxBytes ?? 1_500_000;
  const timeoutMs = opts.timeoutMs ?? 12_000;
  const u = assertPublicUrl(url, opts.allowPrivate);
  const html = await getText(u.toString(), f, maxBytes, timeoutMs);
  const root = parseHtml(html);
  const hrefs = root
    .querySelectorAll('link[rel~="stylesheet"]')
    .map((l) => l.getAttribute("href"))
    .filter((h): h is string => !!h && !/fonts\.googleapis\.com/.test(h))
    .slice(0, opts.maxStylesheets ?? 8);
  const css = await Promise.all(
    hrefs.map((h) => getText(new URL(h, u).toString(), f, maxBytes, timeoutMs).catch(() => "")),
  );
  return { url: u.toString(), html, css: css.filter(Boolean) };
}
