import { findColors, type ColorHit } from "./colors";

export interface CssRule {
  selector: string;
  decls: Array<[prop: string, value: string]>;
}

/** Tolerant, dependency-free CSS rule splitter (good enough for signal extraction). */
export function parseCss(css: string): CssRule[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: CssRule[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) {
    const selector = m[1]!.trim();
    if (selector.startsWith("@")) continue;
    const decls = m[2]!
      .split(";")
      .map((d) => {
        const i = d.indexOf(":");
        return i > 0 ? ([d.slice(0, i).trim().toLowerCase(), d.slice(i + 1).trim()] as [string, string]) : null;
      })
      .filter((d): d is [string, string] => !!d);
    rules.push({ selector, decls });
  }
  return rules;
}

const PROP_WEIGHT: Record<string, number> = {
  "background-color": 3,
  background: 3,
  "background-image": 1,
  color: 1.2,
  fill: 1,
  stroke: 0.6,
  "border-color": 0.5,
  border: 0.5,
  "border-top": 0.3,
  "border-bottom": 0.3,
  "outline-color": 0.3,
  "box-shadow": 0.2,
};

const ROLE_FROM_VAR: Array<[RegExp, ColorHit["hint"]]> = [
  [/(primary|brand|main|theme)/, "primary"],
  [/secondary/, "secondary"],
  [/(accent|highlight|cta)/, "accent"],
  [/(^|-)(bg|background|surface|canvas)(-|$)/, "background"],
  [/(^|-)(text|fg|foreground|ink|body)(-|$)/, "text"],
];

const INTERACTIVE = /(button|\.btn|\bcta\b|\[type=.?submit|\.button|a:hover|\blink\b)/i;
const ROOT = /^(html|body|:root|main)\b/i;

export function colorHitsFromCss(rules: CssRule[]): ColorHit[] {
  const hits: ColorHit[] = [];
  for (const r of rules) {
    const interactive = INTERACTIVE.test(r.selector);
    const root = ROOT.test(r.selector);
    for (const [prop, value] of r.decls) {
      if (prop.startsWith("--")) {
        const name = prop.slice(2).toLowerCase();
        const role = ROLE_FROM_VAR.find(([re]) => re.test(name))?.[1];
        for (const hex of findColors(value)) hits.push({ hex, weight: role ? 6 : 0.8, hint: role });
        continue;
      }
      const w = PROP_WEIGHT[prop];
      if (!w) continue;
      const bg = prop.startsWith("background");
      for (const hex of findColors(value)) {
        let weight = w;
        let hint: ColorHit["hint"];
        if (interactive && bg) {
          weight *= 3;
          hint = "primary";
        }
        if (root && bg) {
          weight *= 4;
          hint = "background";
        }
        if (root && prop === "color") {
          weight *= 2;
          hint = "text";
        }
        hits.push({ hex, weight, hint });
      }
    }
  }
  return hits;
}

const GENERIC = new Set([
  "inherit", "initial", "sans-serif", "serif", "monospace", "system-ui", "ui-sans-serif", "ui-serif", "ui-monospace",
  "-apple-system", "blinkmacsystemfont", "segoe ui", "roboto", "helvetica", "helvetica neue", "arial", "apple color emoji",
  "segoe ui emoji", "noto color emoji", "segoe ui symbol", "cursive", "fantasy", "emoji", "var", "times new roman", "georgia",
]);

export function firstFamily(value: string): string | null {
  for (const part of value.split(",")) {
    const fam = part.trim().replace(/^["']|["']$/g, "").trim();
    if (!fam || fam.startsWith("var(")) continue;
    if (GENERIC.has(fam.toLowerCase())) continue;
    return fam;
  }
  return null;
}

export function fontHitsFromCss(rules: CssRule[]): { display: Map<string, number>; body: Map<string, number> } {
  const display = new Map<string, number>();
  const body = new Map<string, number>();
  const add = (m: Map<string, number>, k: string, w: number) => m.set(k, (m.get(k) ?? 0) + w);
  for (const r of rules) {
    const isHeading = /\bh[1-3]\b|heading|title|display|hero/i.test(r.selector);
    const isRoot = ROOT.test(r.selector) || /\bp\b/.test(r.selector);
    for (const [prop, value] of r.decls) {
      let fam: string | null = null;
      if (prop === "font-family") fam = firstFamily(value);
      else if (prop.startsWith("--") && /font/.test(prop)) {
        fam = firstFamily(value);
        if (fam && /(head|display|title)/.test(prop)) add(display, fam, 4);
        else if (fam) add(body, fam, 2);
        continue;
      } else if (prop === "font") {
        const famPart = value.split(/\d(?:px|rem|em|%)?(?:\/[\d.]+\w*)?\s+/).pop();
        fam = famPart ? firstFamily(famPart) : null;
      }
      if (!fam) continue;
      if (isHeading) add(display, fam, 3);
      else if (isRoot) add(body, fam, 3);
      else add(body, fam, 1);
    }
  }
  return { display, body };
}
