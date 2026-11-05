import { z } from "zod";

/**
 * The semantic token contract. Every template in the library is written
 * against these names only, which is what makes any template re-themeable
 * to any brand.
 */
export const COLOR_TOKENS = [
  "background",
  "foreground",
  "surface",
  "surface-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "muted",
  "muted-foreground",
  "border",
  "ring",
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

/** Token pairs that must pass WCAG contrast (text on surface). */
export const CONTRAST_PAIRS: ReadonlyArray<readonly [fg: ColorToken, bg: ColorToken, min: number]> = [
  ["foreground", "background", 4.5],
  ["muted-foreground", "background", 4.5],
  ["surface-foreground", "surface", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["secondary-foreground", "secondary", 4.5],
  ["accent-foreground", "accent", 4.5],
];

/** Any CSS color string; the token engine always emits `oklch(...)`. */
export const CssColor = z.string().min(3).max(64);

export const FontSpec = z.object({
  family: z.string().min(1),
  /** Google Fonts family name, if it should be loaded from there. */
  google: z.boolean().default(true),
  weights: z.array(z.number().int().min(100).max(900)).default([400, 500, 600, 700]),
});
export type FontSpec = z.infer<typeof FontSpec>;

export const Radius = z.enum(["none", "sm", "md", "lg", "xl", "full"]);
export type Radius = z.infer<typeof Radius>;

export const TokenSet = z.object({
  mode: z.enum(["light", "dark"]),
  colors: z.record(z.enum(COLOR_TOKENS), CssColor).refine(
    (c) => COLOR_TOKENS.every((k) => k in c),
    { message: "TokenSet.colors must define every semantic color token" },
  ),
  radius: Radius.default("md"),
  fonts: z.object({ display: FontSpec, body: FontSpec }),
});
export type TokenSet = z.infer<typeof TokenSet>;
export type TokenSetInput = z.input<typeof TokenSet>;
