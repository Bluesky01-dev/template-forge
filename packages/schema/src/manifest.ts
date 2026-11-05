import { z } from "zod";
import { TokenSet } from "./tokens";
import { SECTION_TYPES, type SectionType } from "./sections";

export const STYLE_TAGS = ["minimal", "bold", "editorial", "playful", "corporate", "luxury", "techy", "warm"] as const;

/** template.json — what the ranking engine knows about a library template. */
export const TemplateManifest = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  description: z.string(),
  source: z.object({ kind: z.enum(["framer", "handmade", "other"]), url: z.string().optional(), license: z.string().optional() }),
  industries: z.array(z.string()).min(1),
  mood: z.object({ mode: z.enum(["light", "dark"]), styles: z.array(z.enum(STYLE_TAGS)).min(1) }),
  sections: z.array(z.custom<SectionType>((v) => SECTION_TYPES.includes(v as SectionType))),
  capacity: z.object({
    /** rough amount of copy the template is designed for */
    copy: z.enum(["light", "medium", "heavy"]),
    images: z.enum(["few", "some", "many"]),
  }),
  defaultTokens: TokenSet,
});
export type TemplateManifest = z.infer<typeof TemplateManifest>;
