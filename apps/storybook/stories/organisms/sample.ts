import type { Section, SectionType } from "@tf/schema";
import { SECTION_VARIANTS } from "@tf/schema";
import { templates } from "@tf/templates";

/** First real instance of a section type in the library, re-targeted to a variant. */
export function sample<T extends SectionType>(type: T, variant: (typeof SECTION_VARIANTS)[T][number], tone: Section["tone"] = "default"): Section {
  for (const t of templates)
    for (const p of t.doc.pages)
      for (const s of p.sections) if (s.type === type) return { ...s, variant, tone } as Section;
  throw new Error(`No sample for ${type}`);
}

export const variantsOf = <T extends SectionType>(type: T) => SECTION_VARIANTS[type];
