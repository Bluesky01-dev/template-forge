import type { TemplateManifest, TokenSet } from "@tf/schema";
import { generateTokens, type BrandInput } from "@tf/tokens";

/**
 * Re-theme a template with a brand. The template keeps its *character*
 * (light/dark mode, radius) while colors and fonts come from the brand.
 */
export function themeTemplate(manifest: TemplateManifest, brand: BrandInput, opts: { keepMode?: boolean } = {}): TokenSet {
  const t = manifest.defaultTokens;
  const fontOr = (b: BrandInput["fonts"] extends infer F ? F : never, key: "display" | "body") => {
    const f = (b as BrandInput["fonts"])?.[key];
    return f?.family ? { ...t.fonts[key], ...f, weights: t.fonts[key].weights } : t.fonts[key];
  };
  return generateTokens({
    primary: brand.primary,
    secondary: brand.secondary,
    accent: brand.accent,
    mode: opts.keepMode === false ? (brand.mode ?? t.mode) : t.mode,
    radius: brand.radius ?? t.radius,
    fonts: { display: fontOr(brand.fonts, "display"), body: fontOr(brand.fonts, "body") },
  });
}
