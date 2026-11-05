import { z } from "zod";

/** Output of the brand extractor (Phase 1). */
export const BrandProfile = z.object({
  url: z.string().url(),
  name: z.string().optional(),
  colors: z
    .array(
      z.object({
        value: z.string(),
        /** share of visible area, 0..1 */
        weight: z.number().min(0).max(1),
        role: z.enum(["primary", "secondary", "accent", "background", "text", "unknown"]).default("unknown"),
      }),
    )
    .default([]),
  mode: z.enum(["light", "dark"]).optional(),
  fonts: z.object({ display: z.string().optional(), body: z.string().optional() }).default({}),
  logo: z.string().optional(),
  industry: z.string().optional(),
  tone: z.array(z.string()).default([]),
  content: z
    .object({
      headline: z.string().optional(),
      summary: z.string().optional(),
      services: z.array(z.string()).default([]),
      needs: z.array(z.string()).default([]),
    })
    .default({ services: [], needs: [] }),
});
export type BrandProfile = z.infer<typeof BrandProfile>;
