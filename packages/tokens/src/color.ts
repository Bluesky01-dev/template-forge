import { converter, formatCss, formatHex, parse, wcagContrast, clampChroma, type Oklch } from "culori";

const toOklch = converter("oklch");

export function oklch(color: string): Oklch {
  const parsed = parse(color);
  if (!parsed) throw new Error(`Invalid color: ${color}`);
  const c = toOklch(parsed);
  return { mode: "oklch", l: c.l, c: c.c ?? 0, h: c.h ?? 0, alpha: c.alpha };
}

const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;

/** Stable, compact oklch() string that stays inside the sRGB gamut. */
export function fmt(c: Oklch): string {
  const g = clampChroma(c, "oklch") as Oklch;
  return formatCss({ mode: "oklch", l: round(g.l, 4), c: round(g.c ?? 0, 4), h: round(g.h ?? 0, 2) }) as string;
}

export function mix(c: Oklch, patch: Partial<Pick<Oklch, "l" | "c" | "h">>): Oklch {
  return { ...c, ...patch };
}

export function contrast(a: string | Oklch, b: string | Oklch): number {
  return wcagContrast(typeof a === "string" ? a : fmt(a), typeof b === "string" ? b : fmt(b));
}

/**
 * Move `fg` lightness away from `bg` until it meets `min` contrast.
 * Tries both directions and keeps the one that passes first (or the best),
 * measuring the *formatted* value so rounding can never drop below `min`.
 */
export function ensureContrast(fg: Oklch, bg: Oklch, min = 4.5): Oklch {
  const measure = (c: Oklch) => contrast(oklch(fmt(c)), bg);
  if (measure(fg) >= min) return fg;
  let best = fg;
  for (const dir of [bg.l > 0.5 ? -1 : 1, bg.l > 0.5 ? 1 : -1]) {
    for (let step = 1; step <= 100; step++) {
      const l = Math.min(1, Math.max(0, fg.l + dir * step * 0.01));
      const cand = mix(fg, { l });
      if (measure(cand) > measure(best)) best = cand;
      if (measure(cand) >= min) return cand;
      if (l === 0 || l === 1) break;
    }
  }
  return best;
}

/** Best readable text color for a filled background: tinted near-white or near-black. */
export function readableOn(bg: Oklch, min = 4.5): Oklch {
  const light = { mode: "oklch" as const, l: 0.985, c: Math.min(bg.c ?? 0, 0.02), h: bg.h ?? 0 };
  const dark = { mode: "oklch" as const, l: 0.18, c: Math.min(bg.c ?? 0, 0.03), h: bg.h ?? 0 };
  const best = contrast(light, bg) >= contrast(dark, bg) ? light : dark;
  return ensureContrast(best, bg, min);
}

/**
 * A filled color plus its text color. If no text color can reach `min`
 * on the brand fill (mid-tones), nudge the fill's lightness minimally
 * in whichever direction gets there first.
 */
export function filledPair(fill: Oklch, min = 4.5): { fill: Oklch; text: Oklch } {
  const ok = (f: Oklch) => {
    const t = readableOn(f, min);
    return contrast(oklch(fmt(t)), oklch(fmt(f))) >= min ? t : null;
  };
  const direct = ok(fill);
  if (direct) return { fill, text: direct };
  for (let step = 1; step <= 50; step++) {
    for (const dir of [-1, 1]) {
      const f = mix(fill, { l: Math.min(1, Math.max(0, fill.l + dir * step * 0.01)) });
      const t = ok(f);
      if (t) return { fill: f, text: t };
    }
  }
  return { fill, text: readableOn(fill, min) };
}

/** Any CSS color -> #rrggbb (for <input type="color">). */
export function toHex(color: string): string {
  return formatHex(oklch(color)) ?? "#000000";
}
