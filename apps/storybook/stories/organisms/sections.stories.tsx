import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionView } from "@tf/renderer";
import { Tone, type Section } from "@tf/schema";
import { THEMES } from "../../.storybook/themes";
import { sample } from "./sample";

/**
 * Every section (organism) × variant. Use the "tone" control to see the band
 * remapping (surface / primary / inverted) and the toolbar to change theme.
 */
interface Args {
  section: Section;
  tone: Section["tone"];
}
const meta: Meta<Args> = {
  title: "Organisms/Sections",
  argTypes: { tone: { control: "inline-radio", options: Tone.options }, section: { control: "object" } },
  args: { tone: "default" },
  render: ({ section, tone }, ctx) => <SectionView section={{ ...section, tone }} tokens={THEMES[ctx.globals.theme as string] ?? THEMES.aurora!} />,
};
export default meta;
type Story = StoryObj<Args>;

const s = (section: Section): Story => ({ args: { section, tone: section.tone } });

export const NavbarSimple = s(sample("navbar", "simple"));
export const NavbarCentered = s(sample("navbar", "centered"));
export const HeroCentered = s(sample("hero", "centered"));
export const HeroSplit = s(sample("hero", "split"));
export const LogoCloud = s(sample("logo-cloud", "row"));
export const FeaturesGrid = s(sample("features", "grid"));
export const FeaturesAlternating = s(sample("features", "alternating"));
export const Stats = s(sample("stats", "row", "surface"));
export const TestimonialsGrid = s(sample("testimonials", "grid"));
export const TestimonialsSpotlight = s(sample("testimonials", "spotlight"));
export const Pricing = s(sample("pricing", "cards"));
export const FaqAccordion = s(sample("faq", "accordion"));
export const FaqTwoColumn = s(sample("faq", "two-column"));
export const CtaBanner = s(sample("cta", "banner", "primary"));
export const CtaSplit = s(sample("cta", "split", "inverted"));
export const FooterSimple = s(sample("footer", "simple"));
export const FooterColumns = s(sample("footer", "columns"));
