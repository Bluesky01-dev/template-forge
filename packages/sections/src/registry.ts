import type { SectionType } from "@tf/schema";
import type { SectionComponent } from "./types";
import { Navbar } from "./navbar";
import { Hero } from "./hero";
import { Cta, Faq, Features, Footer, LogoCloud, Pricing, Stats, Testimonials } from "./content";

/**
 * Section registry: section `type` -> component.
 * Adding a section to the library = add a Zod schema in @tf/schema + an entry here.
 * The `satisfies` makes TypeScript fail the build if any section type lacks a component.
 */
export const registry = {
  navbar: Navbar,
  hero: Hero,
  "logo-cloud": LogoCloud,
  features: Features,
  stats: Stats,
  testimonials: Testimonials,
  pricing: Pricing,
  faq: Faq,
  cta: Cta,
  footer: Footer,
} satisfies { [K in SectionType]: SectionComponent<K> };
