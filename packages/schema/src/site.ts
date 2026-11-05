import { z } from "zod";
import { TokenSet } from "./tokens";
import { Section } from "./sections";

export const Page = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^\/[a-z0-9\-/]*$/, "slug must start with / and be lowercase-kebab"),
  title: z.string(),
  sections: z.array(Section),
});
export type Page = z.infer<typeof Page>;

/**
 * The SiteDoc is the single source of truth for a generated site.
 * The AI never edits code; it edits this document through validated ops.
 */
export const SiteDoc = z
  .object({
    version: z.literal(1),
    id: z.string().min(1),
    name: z.string(),
    templateId: z.string(),
    meta: z.object({
      title: z.string(),
      description: z.string().default(""),
      favicon: z.string().optional(),
    }),
    tokens: TokenSet,
    pages: z.array(Page).min(1),
  })
  .superRefine((doc, ctx) => {
    const slugs = new Set<string>();
    doc.pages.forEach((p, i) => {
      if (slugs.has(p.slug)) ctx.addIssue({ code: "custom", path: ["pages", i, "slug"], message: `duplicate slug ${p.slug}` });
      slugs.add(p.slug);
      const ids = new Set<string>();
      p.sections.forEach((s, j) => {
        if (ids.has(s.id))
          ctx.addIssue({ code: "custom", path: ["pages", i, "sections", j, "id"], message: `duplicate section id ${s.id}` });
        ids.add(s.id);
      });
    });
  });
export type SiteDoc = z.infer<typeof SiteDoc>;
export type SiteDocInput = z.input<typeof SiteDoc>;
