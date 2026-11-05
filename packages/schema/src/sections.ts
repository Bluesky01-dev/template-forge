import { z } from "zod";

/* ---------- shared atoms of content ---------- */
export const Link = z.object({ label: z.string(), href: z.string().default("#") });
export type Link = z.infer<typeof Link>;
export const Image = z.object({ src: z.string(), alt: z.string().default("") });
export type Image = z.infer<typeof Image>;

/** Visual tone of a section band, mapped to token pairs by the renderer. */
export const Tone = z.enum(["default", "surface", "primary", "inverted"]);
export type Tone = z.infer<typeof Tone>;

const base = { id: z.string().min(1), tone: Tone.default("default") };

/* ---------- section taxonomy ---------- */
export const NavbarSection = z.object({
  ...base,
  type: z.literal("navbar"),
  variant: z.enum(["simple", "centered"]).default("simple"),
  props: z.object({
    brand: z.object({ name: z.string(), logo: Image.optional() }),
    links: z.array(Link).max(8).default([]),
    cta: Link.optional(),
  }),
});

export const HeroSection = z.object({
  ...base,
  type: z.literal("hero"),
  variant: z.enum(["centered", "split"]).default("centered"),
  props: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    primaryCta: Link.optional(),
    secondaryCta: Link.optional(),
    image: Image.optional(),
  }),
});

export const LogoCloudSection = z.object({
  ...base,
  type: z.literal("logo-cloud"),
  variant: z.enum(["row"]).default("row"),
  props: z.object({
    title: z.string().optional(),
    logos: z.array(z.object({ name: z.string(), src: z.string().optional() })).min(1),
  }),
});

export const FeaturesSection = z.object({
  ...base,
  type: z.literal("features"),
  variant: z.enum(["grid", "alternating"]).default("grid"),
  props: z.object({
    eyebrow: z.string().optional(),
    title: z.string(),
    subtitle: z.string().optional(),
    items: z
      .array(z.object({ title: z.string(), description: z.string(), icon: z.string().optional(), image: Image.optional() }))
      .min(1),
  }),
});

export const StatsSection = z.object({
  ...base,
  type: z.literal("stats"),
  variant: z.enum(["row"]).default("row"),
  props: z.object({
    title: z.string().optional(),
    items: z.array(z.object({ value: z.string(), label: z.string() })).min(1).max(6),
  }),
});

export const TestimonialsSection = z.object({
  ...base,
  type: z.literal("testimonials"),
  variant: z.enum(["grid", "spotlight"]).default("grid"),
  props: z.object({
    title: z.string().optional(),
    items: z
      .array(z.object({ quote: z.string(), name: z.string(), role: z.string().optional(), avatar: Image.optional() }))
      .min(1),
  }),
});

export const PricingSection = z.object({
  ...base,
  type: z.literal("pricing"),
  variant: z.enum(["cards"]).default("cards"),
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    plans: z
      .array(
        z.object({
          name: z.string(),
          price: z.string(),
          period: z.string().optional(),
          description: z.string().optional(),
          features: z.array(z.string()).default([]),
          cta: Link,
          highlighted: z.boolean().default(false),
        }),
      )
      .min(1)
      .max(4),
  }),
});

export const FaqSection = z.object({
  ...base,
  type: z.literal("faq"),
  variant: z.enum(["accordion", "two-column"]).default("accordion"),
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    items: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
  }),
});

export const CtaSection = z.object({
  ...base,
  type: z.literal("cta"),
  variant: z.enum(["banner", "split"]).default("banner"),
  props: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    primaryCta: Link,
    secondaryCta: Link.optional(),
  }),
});

export const FooterSection = z.object({
  ...base,
  type: z.literal("footer"),
  variant: z.enum(["simple", "columns"]).default("simple"),
  props: z.object({
    brand: z.object({ name: z.string(), tagline: z.string().optional() }),
    columns: z.array(z.object({ title: z.string(), links: z.array(Link) })).default([]),
    copyright: z.string().optional(),
  }),
});

export const Section = z.discriminatedUnion("type", [
  NavbarSection,
  HeroSection,
  LogoCloudSection,
  FeaturesSection,
  StatsSection,
  TestimonialsSection,
  PricingSection,
  FaqSection,
  CtaSection,
  FooterSection,
]);
export type Section = z.infer<typeof Section>;
export type SectionInput = z.input<typeof Section>;
export type SectionType = Section["type"];
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

export const SECTION_TYPES = Section.options.map((o) => o.shape.type.value) as SectionType[];

/** Variants per section type, derived from the schemas (single source of truth). */
export const SECTION_VARIANTS = Object.fromEntries(
  Section.options.map((o) => [o.shape.type.value, o.shape.variant.unwrap().options]),
) as { [K in SectionType]: ReadonlyArray<SectionOf<K>["variant"]> };
