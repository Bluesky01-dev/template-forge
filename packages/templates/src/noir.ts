import type { SiteDocInput, TemplateManifest } from "@tf/schema";
import { generateTokens } from "@tf/tokens";

const tokens = generateTokens({
  primary: "#e8ff59",
  accent: "#ff6b4a",
  mode: "dark",
  radius: "none",
  fonts: { display: { family: "Space Grotesk", weights: [500, 600, 700] }, body: { family: "Inter" } },
});

export const manifest: TemplateManifest = {
  id: "noir",
  name: "Noir",
  description: "Dark, bold studio/portfolio site with editorial typography and alternating case-study rows.",
  source: { kind: "handmade" },
  industries: ["agency", "studio", "design", "creative", "portfolio", "marketing", "branding", "photography", "architecture"],
  mood: { mode: "dark", styles: ["bold", "editorial", "luxury"] },
  sections: ["navbar", "hero", "logo-cloud", "features", "stats", "testimonials", "faq", "cta", "footer"],
  capacity: { copy: "light", images: "many" },
  defaultTokens: tokens,
};

export const site: SiteDocInput = {
  version: 1,
  id: "noir",
  name: "Noir",
  templateId: "noir",
  meta: { title: "Noir Studio — Brands that refuse to blend in", description: "Independent design & brand studio." },
  tokens,
  pages: [
    {
      id: "home",
      slug: "/",
      title: "Home",
      sections: [
        {
          id: "nav",
          type: "navbar",
          variant: "centered",
          props: {
            brand: { name: "NOIR" },
            links: [
              { label: "Work", href: "#work" },
              { label: "Studio", href: "#studio" },
              { label: "Contact", href: "#contact" },
            ],
            cta: { label: "Start a project", href: "#contact" },
          },
        },
        {
          id: "hero",
          type: "hero",
          variant: "split",
          props: {
            eyebrow: "Independent studio · Est. 2016",
            title: "We build brands that refuse to blend in.",
            subtitle: "Strategy, identity and digital experiences for ambitious companies.",
            primaryCta: { label: "See our work", href: "#work" },
            secondaryCta: { label: "Get in touch", href: "#contact" },
            image: { src: "", alt: "Featured project" },
          },
        },
        {
          id: "clients",
          type: "logo-cloud",
          props: {
            title: "Selected clients",
            logos: [{ name: "Maison" }, { name: "Atlas" }, { name: "Kinfolk" }, { name: "Paragon" }, { name: "Solace" }],
          },
        },
        {
          id: "work",
          type: "features",
          variant: "alternating",
          props: {
            eyebrow: "Selected work",
            title: "Recent case studies",
            items: [
              { title: "Maison — a heritage brand, reborn", description: "A complete identity overhaul and e-commerce relaunch that lifted online sales 3×.", image: { src: "", alt: "Maison case study" } },
              { title: "Atlas — mapping a new category", description: "Naming, identity and product design for a climate-tech startup's public launch.", image: { src: "", alt: "Atlas case study" } },
              { title: "Solace — calm, by design", description: "A wellness app brand system spanning motion, sound and print.", image: { src: "", alt: "Solace case study" } },
            ],
          },
        },
        {
          id: "stats",
          type: "stats",
          tone: "surface",
          props: {
            items: [
              { value: "120+", label: "Brands launched" },
              { value: "14", label: "Design awards" },
              { value: "9", label: "Countries" },
            ],
          },
        },
        {
          id: "quote",
          type: "testimonials",
          variant: "spotlight",
          props: {
            items: [
              { quote: "Noir didn't just design our brand — they gave us the confidence to own our category.", name: "Elena Rossi", role: "Founder, Maison" },
            ],
          },
        },
        {
          id: "services",
          type: "faq",
          variant: "two-column",
          props: {
            title: "How we work",
            subtitle: "Small senior team. No hand-offs. Clear outcomes.",
            items: [
              { question: "Brand strategy", answer: "Positioning, naming and messaging grounded in research." },
              { question: "Visual identity", answer: "Logo, type, colour and systems that scale across every touchpoint." },
              { question: "Digital", answer: "Websites and product design built to convert and to last." },
            ],
          },
        },
        {
          id: "contact",
          type: "cta",
          variant: "split",
          tone: "primary",
          props: {
            title: "Have a project in mind?",
            subtitle: "Tell us about it — we reply within one business day.",
            primaryCta: { label: "hello@noir.studio", href: "mailto:hello@noir.studio" },
          },
        },
        {
          id: "footer",
          type: "footer",
          variant: "simple",
          props: { brand: { name: "NOIR", tagline: "Design & brand studio." } },
        },
      ],
    },
  ],
};
