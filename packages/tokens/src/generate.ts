import {
  COLOR_TOKENS,
  CONTRAST_PAIRS,
  TokenSet,
  type ColorToken,
  type FontSpec,
  type Radius,
} from "@tf/schema";
import { ensureContrast, filledPair, fmt, mix, oklch, contrast } from "./color";

export interface BrandInput {
  primary: string;
  secondary?: string;
  accent?: string;
  mode?: "light" | "dark";
  radius?: Radius;
  fonts?: { display?: Partial<FontSpec>; body?: Partial<FontSpec> };
}

const DEFAULT_FONT: FontSpec = { family: "Inter", google: true, weights: [400, 500, 600, 700] };

/**
 * Brand colors -> full semantic TokenSet with guaranteed WCAG AA text contrast.
 * Neutrals are tinted toward the primary hue so the palette feels cohesive.
 */
export function generateTokens(input: BrandInput): TokenSet {
  const mode = input.mode ?? "light";
  const p = oklch(input.primary);
  const hue = p.h ?? 0;
  const s = input.secondary ? oklch(input.secondary) : mix(p, { h: (hue + 30) % 360, c: (p.c ?? 0) * 0.6 });
  const a = input.accent ? oklch(input.accent) : mix(p, { h: (hue + 180) % 360 });
  const tint = Math.min(p.c ?? 0, 0.012);

  const n = (l: number, c = tint) => ({ mode: "oklch" as const, l, c, h: hue });
  const bg = mode === "light" ? n(0.99, tint * 0.5) : n(0.16);
  const surface = mode === "light" ? n(0.965) : n(0.21);
  const fg = ensureContrast(mode === "light" ? n(0.2, tint * 1.5) : n(0.96, tint), bg, 7);
  const muted = mode === "light" ? n(0.93) : n(0.27);
  const mutedFg = ensureContrast(mode === "light" ? n(0.48) : n(0.72), bg, 4.5);
  const border = mode === "light" ? n(0.9) : n(0.3);

  const P = filledPair(p), S = filledPair(s), A = filledPair(a);

  const colors: Record<ColorToken, string> = {
    background: fmt(bg),
    foreground: fmt(fg),
    surface: fmt(surface),
    "surface-foreground": fmt(ensureContrast(fg, surface, 4.5)),
    primary: fmt(P.fill),
    "primary-foreground": fmt(P.text),
    secondary: fmt(S.fill),
    "secondary-foreground": fmt(S.text),
    accent: fmt(A.fill),
    "accent-foreground": fmt(A.text),
    muted: fmt(muted),
    "muted-foreground": fmt(mutedFg),
    border: fmt(border),
    ring: fmt(P.fill),
  };

  return TokenSet.parse({
    mode,
    colors,
    radius: input.radius ?? "md",
    fonts: {
      display: { ...DEFAULT_FONT, ...input.fonts?.display },
      body: { ...DEFAULT_FONT, ...input.fonts?.body },
    },
  });
}

export interface ContrastResult {
  fg: ColorToken;
  bg: ColorToken;
  ratio: number;
  min: number;
  pass: boolean;
}

export function checkContrast(tokens: TokenSet): ContrastResult[] {
  return CONTRAST_PAIRS.map(([fg, bg, min]) => {
    const ratio = Math.round(contrast(tokens.colors[fg]!, tokens.colors[bg]!) * 100) / 100;
    return { fg, bg, ratio, min, pass: ratio >= min };
  });
}

const RADIUS_REM: Record<Radius, string> = { none: "0rem", sm: "0.25rem", md: "0.5rem", lg: "0.75rem", xl: "1.25rem", full: "9999px" };

/** TokenSet -> CSS custom properties consumed by @tf/ui's Tailwind theme. */
export function tokensToCssVars(tokens: TokenSet): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const k of COLOR_TOKENS) vars[`--tf-${k}`] = tokens.colors[k]!;
  vars["--tf-radius"] = RADIUS_REM[tokens.radius];
  vars["--tf-font-display"] = `"${tokens.fonts.display.family}", ui-sans-serif, system-ui, sans-serif`;
  vars["--tf-font-body"] = `"${tokens.fonts.body.family}", ui-sans-serif, system-ui, sans-serif`;
  return vars;
}

export function tokensToCss(tokens: TokenSet, selector = ":root"): string {
  const body = Object.entries(tokensToCssVars(tokens)).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  return `${selector} {\n${body}\n}`;
}

/** Google Fonts stylesheet URL for the token fonts (null if none are from Google). */
export function googleFontsHref(tokens: TokenSet): string | null {
  const fonts = [tokens.fonts.display, tokens.fonts.body].filter((f) => f.google);
  const unique = new Map<string, Set<number>>();
  for (const f of fonts) {
    const set = unique.get(f.family) ?? new Set<number>();
    f.weights.forEach((w) => set.add(w));
    unique.set(f.family, set);
  }
  if (unique.size === 0) return null;
  const families = [...unique].map(
    ([fam, w]) => `family=${encodeURIComponent(fam).replace(/%20/g, "+")}:wght@${[...w].sort((x, y) => x - y).join(";")}`,
  );
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

export type Tone = "default" | "surface" | "primary" | "inverted";

/**
 * Per-section token remapping. A "primary" band re-points background/foreground
 * (and derived muted/border/button colors) at concrete, contrast-checked values,
 * so components only ever use `bg-background text-foreground` and stay correct.
 */
export function toneVars(tokens: TokenSet, tone: Tone): Record<string, string> {
  if (tone === "default") return {};
  const c = tokens.colors;
  let bgS: string, fgS: string, btn: string, btnFg: string;
  switch (tone) {
    case "surface":
      bgS = c.surface; fgS = c["surface-foreground"]; btn = c.primary; btnFg = c["primary-foreground"];
      break;
    case "primary":
      bgS = c.primary; fgS = c["primary-foreground"]; btn = c["primary-foreground"]; btnFg = c.primary;
      break;
    case "inverted":
      bgS = c.foreground; fgS = c.background; btn = c.primary; btnFg = c["primary-foreground"];
      break;
  }
  const bg = oklch(bgS), fg = oklch(fgS);
  const towardFg = (t: number) => fmt(mix(bg, { l: bg.l + (fg.l - bg.l) * t, c: (bg.c ?? 0) * (1 - t) }));
  // Ensure the band's "button" color is distinguishable from the band itself.
  const btnColor = contrast(btn, bgS) >= 3 ? btn : fgS;
  const btnText = contrast(btn, bgS) >= 3 ? btnFg : bgS;
  return {
    "--tf-background": bgS,
    "--tf-foreground": fgS,
    "--tf-surface": towardFg(0.08),
    "--tf-surface-foreground": fgS,
    "--tf-muted": towardFg(0.12),
    "--tf-muted-foreground": fmt(ensureContrast(mix(fg, { l: fg.l + (bg.l - fg.l) * 0.25 }), bg, 4.5)),
    "--tf-border": towardFg(0.18),
    "--tf-primary": btnColor,
    "--tf-primary-foreground": btnText,
    "--tf-ring": btnColor,
  };
}
