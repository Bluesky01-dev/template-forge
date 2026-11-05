import type { BrandProfile, SectionType, TemplateManifest, TokenSet } from "@tf/schema";
import { contrast, type BrandInput } from "@tf/tokens";
import type { LibraryTemplate } from "@tf/templates";
import { themeTemplate } from "./theme";

export const WEIGHTS = { industry: 0.3, coverage: 0.25, mood: 0.2, content: 0.15, contrast: 0.1 } as const;
export type Criterion = keyof typeof WEIGHTS;

export interface RankedTemplate {
  templateId: string;
  name: string;
  /** 0..100 */
  score: number;
  breakdown: Record<Criterion, number>;
  reasons: string[];
  warnings: string[];
  tokens: TokenSet;
}

const RELATED: string[][] = [
  ["saas", "software", "startup", "tech", "app", "ai", "fintech", "productivity", "ecommerce"],
  ["agency", "studio", "design", "creative", "portfolio", "marketing", "branding", "photography", "architecture"],
  ["local", "services", "trades", "electrical", "plumbing", "real-estate", "realty", "legal"],
  ["restaurant", "cafe", "hospitality", "local"],
  ["health", "wellness", "clinic", "fitness", "local"],
];

/** Brand "needs" (detected on the client's site) -> section types that satisfy them. */
export const NEED_TO_SECTIONS: Record<string, SectionType[]> = {
  pricing: ["pricing"],
  testimonials: ["testimonials"],
  faq: ["faq"],
  portfolio: ["features"],
  booking: ["cta"],
  contact: ["cta"],
  stats: ["stats"],
  logos: ["logo-cloud"],
  team: ["features"],
};

const TONE_TO_STYLES: Record<string, string[]> = {
  friendly: ["warm", "playful"],
  professional: ["corporate", "minimal", "techy"],
  premium: ["luxury", "editorial", "minimal"],
  bold: ["bold", "editorial"],
  playful: ["playful", "warm"],
};

function industryScore(profile: BrandProfile, m: TemplateManifest): [number, string | null] {
  const ind = profile.industry;
  if (!ind) return [0.5, null];
  if (m.industries.includes(ind)) return [1, `Built for ${ind} businesses`];
  const related = RELATED.some((g) => g.includes(ind) && m.industries.some((i) => g.includes(i)));
  return related ? [0.6, `Close fit for ${ind} (${m.industries.slice(0, 3).join(", ")})`] : [0.15, null];
}

function coverageScore(profile: BrandProfile, m: TemplateManifest): [number, string[], string[]] {
  const needs = profile.content.needs.filter((n) => n in NEED_TO_SECTIONS);
  if (needs.length === 0) return [0.7, [], []];
  const covered = needs.filter((n) => NEED_TO_SECTIONS[n]!.some((s) => m.sections.includes(s)));
  const missing = needs.filter((n) => !covered.includes(n));
  let score = covered.length / needs.length;
  if (needs.includes("portfolio")) score = score * 0.8 + (m.capacity.images === "many" ? 0.2 : m.capacity.images === "some" ? 0.1 : 0);
  return [Math.min(1, score), covered, missing];
}

function moodScore(profile: BrandProfile, brand: BrandInput, m: TemplateManifest): [number, string | null] {
  const modeMatch = !profile.mode || (brand.mode ?? profile.mode) === m.mood.mode;
  const wanted = new Set(profile.tone.flatMap((t) => TONE_TO_STYLES[t] ?? []));
  const styleHits = m.mood.styles.filter((s) => wanted.has(s));
  const style = wanted.size === 0 ? 0.6 : Math.min(1, styleHits.length / Math.min(2, wanted.size));
  const score = (modeMatch ? 0.6 : 0.25) + 0.4 * style;
  const reason = modeMatch
    ? `${m.mood.mode === "dark" ? "Dark" : "Light"} look matches their site${styleHits.length ? `, ${styleHits.join("/")} feel` : ""}`
    : null;
  return [score, reason];
}

const COPY_LEVEL = { light: 0, medium: 1, heavy: 2 } as const;
function contentScore(profile: BrandProfile, m: TemplateManifest): number {
  const n = profile.content.services.length + (profile.content.summary && profile.content.summary.length > 160 ? 2 : 0);
  const level = n <= 3 ? 0 : n <= 7 ? 1 : 2;
  return [1, 0.6, 0.3][Math.abs(level - COPY_LEVEL[m.capacity.copy])]!;
}

/** Can the brand's primary be told apart from the background (WCAG 1.4.11, 3:1)? */
function contrastScore(tokens: TokenSet): [number, number] {
  const r = contrast(tokens.colors.primary, tokens.colors.background);
  return [0.4 + 0.6 * Math.min(1, r / 3), Math.round(r * 100) / 100];
}

export function rankTemplates(profile: BrandProfile, brand: BrandInput, library: LibraryTemplate[]): RankedTemplate[] {
  return library
    .map(({ manifest: m }) => {
      const tokens = themeTemplate(m, brand);
      const reasons: string[] = [];
      const warnings: string[] = [];

      const [industry, indReason] = industryScore(profile, m);
      if (indReason) reasons.push(indReason);
      const [coverage, covered, missing] = coverageScore(profile, m);
      if (covered.length) reasons.push(`Has the sections they need: ${covered.join(", ")}`);
      if (missing.length) warnings.push(`No dedicated section for: ${missing.join(", ")}`);
      const [mood, moodReason] = moodScore(profile, brand, m);
      if (moodReason) reasons.push(moodReason);
      else warnings.push(`Template is ${m.mood.mode}; their site is ${m.mood.mode === "dark" ? "light" : "dark"}`);
      const content = contentScore(profile, m);
      const [contrastS, ratio] = contrastScore(tokens);
      if (ratio < 3) warnings.push(`Brand color is low-contrast on this background (${ratio}:1) — buttons may need a darker shade`);

      const breakdown: Record<Criterion, number> = {
        industry: round(industry),
        coverage: round(coverage),
        mood: round(mood),
        content: round(content),
        contrast: round(contrastS),
      };
      const score = Math.round(
        (Object.keys(WEIGHTS) as Criterion[]).reduce((s, k) => s + WEIGHTS[k] * breakdown[k], 0) * 100,
      );
      return { templateId: m.id, name: m.name, score, breakdown, reasons, warnings, tokens };
    })
    .sort((a, b) => b.score - a.score);
}

const round = (n: number) => Math.round(n * 100) / 100;
