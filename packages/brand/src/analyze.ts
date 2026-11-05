import { parse as parseHtml, type HTMLElement } from "node-html-parser";
import { BrandProfile } from "@tf/schema";
import type { BrandInput } from "@tf/tokens";
import { clusterColors, findColors, hueDistance, isNeutral, type ColorCluster, type ColorHit } from "./colors";
import { colorHitsFromCss, fontHitsFromCss, parseCss } from "./css";
import { classifyIndustry, detectNeeds, detectTone } from "./content";
import { googleFamiliesFromLinks, isGoogleFont } from "./fonts";

export interface SiteSnapshot {
  url: string;
  html: string;
  /** contents of linked stylesheets */
  css: string[];
}

export interface BrandAnalysis {
  profile: BrandProfile;
  /** ready to feed into @tf/tokens generateTokens() */
  input: BrandInput;
  /** debugging / UI: clusters considered */
  palette: Array<{ hex: string; weight: number; neutral: boolean }>;
}

const abs = (href: string | undefined, base: string) => {
  if (!href) return undefined;
  try {
    return new URL(href, base).toString();
  } catch {
    return undefined;
  }
};

/** Section titles that are not services ("Our services", "Reviews", "FAQ"…). */
const GENERIC_HEADING =
  /^(our |my |the )?(services?|what we do|about( us)?|reviews?|testimonials?|faqs?|frequently asked questions|contact( us)?|get in touch|pricing|plans|our (work|team|clients)|gallery|blog|news|why (choose )?us|how it works|features)[\s.!:?]*$|what (our |people |customers |clients )?(customers |clients )?say|reviews from/i;

const text = (el: HTMLElement | null | undefined) => el?.textContent.replace(/\s+/g, " ").trim() || undefined;

function pickLogo(root: HTMLElement, base: string): string | undefined {
  const imgs = root.querySelectorAll("img, svg image");
  const logo = imgs.find((i) =>
    /logo/i.test(`${i.getAttribute("alt") ?? ""} ${i.getAttribute("class") ?? ""} ${i.getAttribute("src") ?? ""} ${i.getAttribute("id") ?? ""}`),
  );
  if (logo) return abs(logo.getAttribute("src") ?? logo.getAttribute("href"), base);
  const icon =
    root.querySelector('link[rel="apple-touch-icon"]') ??
    root.querySelector('link[rel="icon"]') ??
    root.querySelector('link[rel="shortcut icon"]');
  return abs(icon?.getAttribute("href"), base);
}

export function analyzeSite(snap: SiteSnapshot): BrandAnalysis {
  const root = parseHtml(snap.html, { comment: false, blockTextElements: { script: false, noscript: false, style: true } });
  const inlineCss = root.querySelectorAll("style").map((s) => s.textContent);
  const rules = parseCss([...snap.css, ...inlineCss].join("\n"));

  /* ---- colors ---- */
  const hits: ColorHit[] = colorHitsFromCss(rules);
  const themeColor = root.querySelector('meta[name="theme-color"]')?.getAttribute("content");
  if (themeColor) for (const hex of findColors(themeColor)) hits.push({ hex, weight: 10, hint: "primary" });
  for (const el of root.querySelectorAll("[style]")) {
    const style = el.getAttribute("style") ?? "";
    const isBtn = /^(a|button)$/i.test(el.tagName) || /btn|button|cta/i.test(el.getAttribute("class") ?? "");
    for (const m of style.matchAll(/(background(?:-color)?|color)\s*:\s*([^;]+)/gi))
      for (const hex of findColors(m[2]!))
        hits.push({ hex, weight: m[1]!.startsWith("background") ? (isBtn ? 6 : 2) : 0.8, hint: isBtn && m[1]!.startsWith("background") ? "primary" : undefined });
  }
  const clusters = clusterColors(hits);
  const total = clusters.reduce((s, c) => s + c.weight, 0) || 1;
  const chromatic = clusters.filter((c) => !isNeutral(c));
  const neutrals = clusters.filter((c) => isNeutral(c));

  const byHint = (h: string) => chromatic.find((c) => c.hints.has(h));
  const primary = byHint("primary") ?? chromatic[0];
  const distinct = (c: ColorCluster, from: Array<ColorCluster | undefined>) =>
    from.every((f) => !f || hueDistance(c.h, f.h) > 25 || Math.abs(c.l - f.l) > 0.25);
  const secondary = byHint("secondary") ?? chromatic.find((c) => c !== primary && distinct(c, [primary]));
  const accent = byHint("accent") ?? chromatic.find((c) => c !== primary && c !== secondary && distinct(c, [primary, secondary]));

  const bgCluster = clusters.find((c) => c.hints.has("background")) ?? neutrals.find((n) => n.l > 0.9 || n.l < 0.25);
  const mode: "light" | "dark" = bgCluster && bgCluster.l < 0.45 ? "dark" : "light";

  /* ---- fonts ---- */
  const linkHrefs = root.querySelectorAll("link").map((l) => l.getAttribute("href") ?? "");
  const googleFams = googleFamiliesFromLinks(linkHrefs);
  const { display, body } = fontHitsFromCss(rules);
  const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const bodyFont = top(body) ?? googleFams[0];
  const displayFont = top(display) ?? (googleFams.find((f) => f !== bodyFont) || bodyFont);

  /* ---- content ---- */
  const title = text(root.querySelector("title"));
  const siteName =
    root.querySelector('meta[property="og:site_name"]')?.getAttribute("content") ??
    title?.split(/\s[|\-–—·:]\s/)[0]?.trim();
  const description =
    root.querySelector('meta[name="description"]')?.getAttribute("content") ??
    root.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
    undefined;
  const h1 = text(root.querySelector("h1"));
  const heads = (sel: string) =>
    root
      .querySelectorAll(sel)
      .map((h) => text(h))
      .filter((t): t is string => !!t && t.length > 3 && t.length < 80 && !GENERIC_HEADING.test(t));
  // Item-level headings (h3/h4) describe services best; fall back to h2s.
  const h3s = heads("h3, h4");
  const subheads = h3s.length >= 3 ? h3s : [...h3s, ...heads("h2")];
  const bodyText = text(root.querySelector("body")) ?? "";
  const corpus = [title, description, h1, ...subheads, bodyText.slice(0, 20000)].filter(Boolean).join(" \n ");
  const { industry } = classifyIndustry(corpus);

  const profile = BrandProfile.parse({
    url: snap.url,
    name: siteName,
    colors: [
      ...[primary, secondary, accent]
        .map((c, i) => c && { value: c.hex, weight: Math.min(1, c.weight / total), role: (["primary", "secondary", "accent"] as const)[i] })
        .filter(Boolean),
      ...(bgCluster ? [{ value: bgCluster.hex, weight: Math.min(1, bgCluster.weight / total), role: "background" as const }] : []),
    ],
    mode,
    fonts: { display: displayFont, body: bodyFont },
    logo: pickLogo(root, snap.url),
    industry,
    tone: detectTone(corpus),
    content: {
      headline: h1,
      summary: description,
      services: [...new Set(subheads)].slice(0, 8),
      needs: detectNeeds(corpus),
    },
  });

  const fontSpec = (f?: string) => (f ? { family: f, google: isGoogleFont(f) || googleFams.includes(f) } : undefined);
  const input: BrandInput = {
    primary: primary?.hex ?? (mode === "dark" ? "#e5e7eb" : "#111827"),
    secondary: secondary?.hex,
    accent: accent?.hex,
    mode,
    fonts: { display: fontSpec(displayFont), body: fontSpec(bodyFont) },
  };

  return {
    profile,
    input,
    palette: clusters.slice(0, 12).map((c) => ({ hex: c.hex, weight: Math.round((c.weight / total) * 1000) / 1000, neutral: isNeutral(c) })),
  };
}
