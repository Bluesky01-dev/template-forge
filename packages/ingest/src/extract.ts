import { parse as parseHtml } from "node-html-parser";
import { clusterColors, colorHitsFromCss, findColors, fontHitsFromCss, hueDistance, isNeutral, parseCss, type ColorHit } from "@tf/brand";
import type { BrandInput } from "@tf/tokens";
import type { SourceFile } from "./scan";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */

const JS_STYLE_PROPS: Record<string, number> = {
  backgroundColor: 3,
  background: 3,
  color: 1.2,
  fill: 1,
  borderColor: 0.5,
  stroke: 0.6,
};

/** Colors from JS style objects / Framer token vars in TSX/JSX source. */
export function colorHitsFromCode(src: string): ColorHit[] {
  const hits: ColorHit[] = [];
  const propRe = /["']?(backgroundColor|background|color|fill|borderColor|stroke)["']?\s*:\s*["'`]([^"'`]{3,120})["'`]/g;
  for (const m of src.matchAll(propRe)) {
    // Framer emits var(--token-uuid, rgb(...)): findColors picks up the fallback value.
    for (const hex of findColors(m[2]!)) hits.push({ hex, weight: JS_STYLE_PROPS[m[1]!] ?? 1 });
  }
  // Framer color tokens declared as CSS vars: "--token-xxxx": "rgb(…)"
  for (const m of src.matchAll(/["'](--token-[\w-]+|--[\w-]*(?:primary|brand|accent|secondary)[\w-]*)["']\s*:\s*["']([^"']+)["']/g)) {
    const name = m[1]!.toLowerCase();
    const hint = /secondary/.test(name) ? "secondary" : /accent/.test(name) ? "accent" : /primary|brand/.test(name) ? "primary" : undefined;
    for (const hex of findColors(m[2]!)) hits.push({ hex, weight: hint ? 6 : 1.5, hint });
  }
  // Tailwind arbitrary values: bg-[#123456], text-[#abcdef]
  for (const m of src.matchAll(/\b(bg|text|border|fill|from|to|via)-\[(#[0-9a-fA-F]{3,8})\]/g)) {
    for (const hex of findColors(m[2]!)) hits.push({ hex, weight: m[1] === "bg" ? 3 : 1 });
  }
  return hits;
}

/** Fonts from JS styles and Framer's "GF;Family-600" / "FS;Family" font ids. */
export function fontsFromCode(src: string): Map<string, number> {
  const m = new Map<string, number>();
  const add = (f: string, w: number) => m.set(f, (m.get(f) ?? 0) + w);
  for (const x of src.matchAll(/["'](?:GF|FS|CUSTOM);([A-Za-z][\w ]+?)-(?:regular|\d{3}|bold|medium|semibold|italic)/gi)) add(x[1]!.trim(), 2);
  for (const x of src.matchAll(/fontFamily\s*:\s*["'`]\s*["']?([A-Za-z][\w ]+?)["']?\s*[,"'`]/g)) {
    if (!/^(var|inherit|sans-serif|serif|system-ui|monospace)$/i.test(x[1]!)) add(x[1]!.trim(), 1);
  }
  for (const x of src.matchAll(/family=([A-Za-z+]+)/g)) add(x[1]!.replace(/\+/g, " "), 2);
  return m;
}

export function extractTokens(files: SourceFile[]): { input: BrandInput; palette: Array<{ hex: string; weight: number }> } {
  const css = files.filter((f) => f.ext === ".css" || f.ext === ".scss").map((f) => f.content);
  const styleBlocks = files
    .filter((f) => f.ext === ".astro" || f.ext === ".html")
    .flatMap((f) => [...f.content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]!));
  const rules = parseCss([...css, ...styleBlocks].join("\n"));
  const code = files.filter((f) => /\.(tsx|jsx|ts|js|mjs|astro|html)$/.test(f.path)).map((f) => f.content).join("\n");

  const clusters = clusterColors([...colorHitsFromCss(rules), ...colorHitsFromCode(code)]);
  const chromatic = clusters.filter((c) => !isNeutral(c));
  const primary = chromatic.find((c) => c.hints.has("primary")) ?? chromatic[0];
  const secondary = chromatic.find((c) => c !== primary && (c.hints.has("secondary") || hueDistance(c.h, primary?.h ?? 0) > 25));
  const accent = chromatic.find((c) => c !== primary && c !== secondary && (c.hints.has("accent") || hueDistance(c.h, primary?.h ?? 0) > 25));
  const neutrals = clusters.filter(isNeutral);
  const bg = clusters.find((c) => c.hints.has("background")) ?? neutrals[0];
  const mode = bg && bg.l < 0.45 ? "dark" : "light";

  const cssFonts = fontHitsFromCss(rules);
  const codeFonts = fontsFromCode(code);
  const merged = new Map<string, number>([...cssFonts.body, ...codeFonts]);
  for (const [k, v] of cssFonts.display) merged.set(k, (merged.get(k) ?? 0) + v);
  const ranked = [...merged.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f);
  const display = [...cssFonts.display.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ranked[0];
  const body = ranked.find((f) => f !== display) ?? display;

  const total = clusters.reduce((s, c) => s + c.weight, 0) || 1;
  return {
    input: {
      primary: primary?.hex ?? (mode === "dark" ? "#e5e7eb" : "#111827"),
      secondary: secondary?.hex,
      accent: accent?.hex,
      mode,
      fonts: { display: display ? { family: display } : undefined, body: body ? { family: body } : undefined },
    },
    palette: clusters.slice(0, 10).map((c) => ({ hex: c.hex, weight: Math.round((c.weight / total) * 1000) / 1000 })),
  };
}

/* ------------------------------------------------------------------ */
/* Content outline                                                     */
/* ------------------------------------------------------------------ */

export type NodeKind = "h1" | "h2" | "h3" | "p" | "link" | "button" | "img" | "nav" | "footer" | "text";
export interface OutlineNode {
  kind: NodeKind;
  text: string;
  href?: string;
  file: string;
}

const clean = (s: string) =>
  s
    .replace(/\{[^}]*\}/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const TAG_KIND: Record<string, NodeKind> = { h1: "h1", h2: "h2", h3: "h3", h4: "h3", h5: "h3", p: "p", a: "link", button: "button", li: "text", span: "text" };

/** Ordered outline of visible text from markup-ish sources (JSX, Astro, HTML). */
export function extractOutline(files: SourceFile[]): OutlineNode[] {
  const nodes: OutlineNode[] = [];
  for (const f of files) {
    if (!/\.(tsx|jsx|astro|html)$/.test(f.path)) continue;
    // Strip frontmatter / imports / scripts / styles so the parser sees only markup.
    let src = f.content.replace(/^---[\s\S]*?---/, "").replace(/<(script|style)[\s\S]*?<\/\1>/g, "");
    if (f.ext !== ".html") src = src.replace(/^\s*(import|export\s+(const|type|interface|default\s+(async\s+)?function\s*\w*\s*\([^)]*\)\s*\{?))[^\n]*$/gm, "");
    const root = parseHtml(src, { lowerCaseTagName: true, comment: false });
    root.querySelectorAll("h1,h2,h3,h4,h5,p,a,button,img,nav,footer").forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === "img") {
        const alt = el.getAttribute("alt");
        if (alt) nodes.push({ kind: "img", text: alt, file: f.path });
        return;
      }
      if (tag === "nav" || tag === "footer") {
        nodes.push({ kind: tag, text: "", file: f.path });
        return;
      }
      const text = clean(el.textContent);
      if (!text || text.length < 2 || text.length > 400) return;
      if (/^[\W\d_]+$/.test(text) && !/\d/.test(text)) return;
      nodes.push({ kind: TAG_KIND[tag] ?? "text", text, href: el.getAttribute("href") ?? undefined, file: f.path });
    });
    // Framer components often pass copy as string props (text="…", title="…").
    for (const m of f.content.matchAll(/\b(title|heading|text|label|subtitle|description)=\{?["'`]([^"'`{}]{3,300})["'`]\}?/g)) {
      nodes.push({ kind: m[1] === "title" || m[1] === "heading" ? "h3" : m[1] === "label" ? "button" : "p", text: clean(m[2]!), file: f.path });
    }
  }
  // De-duplicate consecutive repeats (responsive variants render the same copy several times).
  const seen = new Set<string>();
  return nodes.filter((n) => {
    if (!n.text) return true;
    const k = `${n.kind}:${n.text}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function outlineToText(nodes: OutlineNode[], max = 400): string {
  return nodes
    .slice(0, max)
    .map((n) => (n.kind === "nav" || n.kind === "footer" ? `<${n.kind}>` : `${n.kind}: ${n.text}${n.href ? ` (→ ${n.href})` : ""}`))
    .join("\n");
}
