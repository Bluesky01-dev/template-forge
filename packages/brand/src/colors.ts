import { converter, differenceEuclidean, formatHex, parse } from "culori";

const toOklch = converter("oklch");
const dist = differenceEuclidean("oklab");

export interface ColorHit {
  hex: string;
  weight: number;
  /** strong hint from a token name or theme-color meta */
  hint?: "primary" | "secondary" | "accent" | "background" | "text";
}

export interface ColorCluster {
  hex: string;
  weight: number;
  l: number;
  c: number;
  h: number;
  hints: Set<string>;
}

const COLOR_RE =
  /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\([^)]*\)/gi;

export function normalizeColor(raw: string): string | null {
  const c = parse(raw.trim());
  if (!c) return null;
  if (c.alpha !== undefined && c.alpha < 0.5) return null;
  return formatHex(c) ?? null;
}

export function findColors(value: string): string[] {
  return (value.match(COLOR_RE) ?? []).map(normalizeColor).filter((x): x is string => !!x);
}

/** Merge near-identical colors (ΔE in OKLab) and accumulate their weight. */
export function clusterColors(hits: ColorHit[], threshold = 0.045): ColorCluster[] {
  const clusters: ColorCluster[] = [];
  for (const hit of hits) {
    const found = clusters.find((c) => dist(c.hex, hit.hex) < threshold);
    if (found) {
      found.weight += hit.weight;
      if (hit.hint) found.hints.add(hit.hint);
      continue;
    }
    const o = toOklch(parse(hit.hex)!);
    clusters.push({ hex: hit.hex, weight: hit.weight, l: o.l, c: o.c ?? 0, h: o.h ?? 0, hints: new Set(hit.hint ? [hit.hint] : []) });
  }
  return clusters.sort((a, b) => b.weight - a.weight);
}

export const isNeutral = (c: { c: number; l: number }) => c.c < 0.035 || c.l > 0.97 || c.l < 0.08;

export function hueDistance(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
