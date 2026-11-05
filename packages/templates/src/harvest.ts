import type { SiteDocInput, TemplateManifest } from "@tf/schema";
import { generateTokens } from "@tf/tokens";

const tokens = generateTokens({
  primary: "#2f6b3a",
  accent: "#d97706",
  secondary: "#f4e9d8",
  mode: "light",
  radius: "xl",
  fonts: { display: { family: "Fraunces", weights: [500, 600, 700] }, body: { family: "DM Sans" } },
});

export const manifest: TemplateManifest = {
  id: "harvest",
  name: "Harvest",
  description: "Warm, friendly site for local businesses and services: trust signals, services, reviews and a strong call to book.",
  source: { kind: "handmade" },
  industries: ["local", "services", "restaurant", "cafe", "health", "wellness", "clinic", "trades", "electrical", "plumbing", "real-estate", "realty", "hospitality", "fitness"],
  mood: { mode: "light", styles: ["warm", "playful"] },
  sections: ["navbar", "hero", "stats", "features", "testimonials", "faq", "cta", "footer"],
  capacity: { copy: "medium", images: "some" },
  defaultTokens: tokens,
};

export const site: SiteDocInput = {
  version: 1,
  id: "harvest",
  name: "Harvest",
  templateId: "harvest",
  meta: { title: "Harvest & Co — Local, trusted, here for you", description: "Friendly local service you can count on." },
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
          variant: "simple",
          props: {
            brand: { name: "Harvest & Co" },
            links: [
              { label: "Services", href: "#services" },
              { label: "Reviews", href: "#reviews" },
              { label: "FAQ", href: "#faq" },
            ],
            cta: { label: "Book now", href: "#book" },
          },
        },
        {
          id: "hero",
          type: "hero",
          variant: "split",
          tone: "surface",
          props: {
            eyebrow: "Family owned · Since 1998",
            title: "Local, trusted, and here when you need us",
            subtitle: "Friendly experts serving the community with honest pricing and work we're proud of.",
            primaryCta: { label: "Book an appointment", href: "#book" },
            secondaryCta: { label: "Call (555) 012-3456", href: "tel:5550123456" },
            image: { src: "", alt: "Our team at work" },
          },
        },
        {
          id: "stats",
          type: "stats",
          props: {
            items: [
              { value: "25+", label: "Years serving locals" },
              { value: "4.9★", label: "Google rating" },
              { value: "8,000+", label: "Happy customers" },
            ],
          },
        },
        {
          id: "services",
          type: "features",
          variant: "grid",
          props: {
            eyebrow: "What we do",
            title: "Services built around you",
            items: [
              { title: "Consultations", description: "A clear plan and an honest quote before any work starts.", icon: "check" },
              { title: "Same-week service", description: "Fast scheduling that fits around your life.", icon: "bolt" },
              { title: "Guaranteed work", description: "Every job backed by our satisfaction guarantee.", icon: "shield" },
            ],
          },
        },
        {
          id: "reviews",
          type: "testimonials",
          variant: "grid",
          tone: "surface",
          props: {
            title: "What our neighbours say",
            items: [
              { quote: "Friendly, on time and fairly priced. Couldn't ask for more.", name: "Sarah M.", role: "Local customer" },
              { quote: "They explained everything and the result was perfect.", name: "James T.", role: "Local customer" },
              { quote: "Our go-to for years. Highly recommended.", name: "Anita R.", role: "Local customer" },
            ],
          },
        },
        {
          id: "faq",
          type: "faq",
          props: {
            title: "Questions, answered",
            items: [
              { question: "What areas do you serve?", answer: "We serve the city and all surrounding suburbs within 30 km." },
              { question: "Do you offer free quotes?", answer: "Yes — every quote is free and comes with no obligation." },
              { question: "How do I book?", answer: "Book online in under a minute, or give us a call." },
            ],
          },
        },
        {
          id: "book",
          type: "cta",
          variant: "banner",
          tone: "primary",
          props: {
            title: "Let's get you booked in",
            subtitle: "Most appointments available within the week.",
            primaryCta: { label: "Book online", href: "#" },
            secondaryCta: { label: "Call us", href: "tel:5550123456" },
          },
        },
        {
          id: "footer",
          type: "footer",
          variant: "columns",
          props: {
            brand: { name: "Harvest & Co", tagline: "Proudly local since 1998." },
            columns: [
              { title: "Visit", links: [{ label: "12 Market Street", href: "#" }, { label: "Mon–Sat 8am–6pm", href: "#" }] },
              { title: "Contact", links: [{ label: "(555) 012-3456", href: "tel:5550123456" }, { label: "hello@harvest.co", href: "mailto:hello@harvest.co" }] },
            ],
          },
        },
      ],
    },
  ],
};
