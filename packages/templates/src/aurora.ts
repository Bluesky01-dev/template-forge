import type { SiteDocInput, TemplateManifest } from "@tf/schema";
import { generateTokens } from "@tf/tokens";

const tokens = generateTokens({
  primary: "#4f46e5",
  accent: "#06b6d4",
  mode: "light",
  radius: "lg",
  fonts: { display: { family: "Inter Tight", weights: [500, 600, 700] }, body: { family: "Inter" } },
});

export const manifest: TemplateManifest = {
  id: "aurora",
  name: "Aurora",
  description: "Clean, light SaaS landing page with product-led hero, feature grid, pricing and FAQ.",
  source: { kind: "handmade" },
  industries: ["saas", "software", "startup", "tech", "app", "ai", "fintech", "productivity"],
  mood: { mode: "light", styles: ["minimal", "techy", "corporate"] },
  sections: ["navbar", "hero", "logo-cloud", "features", "stats", "testimonials", "pricing", "faq", "cta", "footer"],
  capacity: { copy: "medium", images: "few" },
  defaultTokens: tokens,
};

export const site: SiteDocInput = {
  version: 1,
  id: "aurora",
  name: "Aurora",
  templateId: "aurora",
  meta: { title: "Aurora — Ship faster", description: "The platform teams use to ship faster." },
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
            brand: { name: "Aurora" },
            links: [
              { label: "Product", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Customers", href: "#testimonials" },
              { label: "FAQ", href: "#faq" },
            ],
            cta: { label: "Start free", href: "#cta" },
          },
        },
        {
          id: "hero",
          type: "hero",
          variant: "centered",
          props: {
            eyebrow: "New · Automations 2.0",
            title: "Ship your product faster, with less busywork",
            subtitle: "Aurora brings planning, building and launching into one calm workspace your whole team actually enjoys.",
            primaryCta: { label: "Start free trial", href: "#cta" },
            secondaryCta: { label: "Book a demo", href: "#cta" },
            image: { src: "", alt: "Product screenshot" },
          },
        },
        {
          id: "logos",
          type: "logo-cloud",
          props: {
            title: "Trusted by fast-moving teams",
            logos: [{ name: "Northwind" }, { name: "Lumen" }, { name: "Vertex" }, { name: "Halcyon" }, { name: "Orbit" }],
          },
        },
        {
          id: "features",
          type: "features",
          variant: "grid",
          tone: "surface",
          props: {
            eyebrow: "Features",
            title: "Everything you need, nothing you don't",
            subtitle: "Thoughtful tools that remove friction from every step of your workflow.",
            items: [
              { title: "Instant setup", description: "Import your work in minutes and start collaborating right away.", icon: "bolt" },
              { title: "Secure by default", description: "SSO, audit logs and granular permissions out of the box.", icon: "shield" },
              { title: "Real-time insights", description: "Dashboards that update as your team moves.", icon: "chart" },
              { title: "Works everywhere", description: "Web, desktop and mobile apps that stay in sync.", icon: "globe" },
              { title: "Automations", description: "Let routine work run itself with no-code rules.", icon: "layers" },
              { title: "Loved by teams", description: "A calm interface people genuinely enjoy using.", icon: "heart" },
            ],
          },
        },
        {
          id: "stats",
          type: "stats",
          props: {
            items: [
              { value: "12k+", label: "Teams" },
              { value: "99.99%", label: "Uptime" },
              { value: "4.9/5", label: "Average rating" },
              { value: "38%", label: "Faster delivery" },
            ],
          },
        },
        {
          id: "testimonials",
          type: "testimonials",
          variant: "grid",
          props: {
            title: "Teams ship more with Aurora",
            items: [
              { quote: "We cut our release cycle in half within a month.", name: "Maya Chen", role: "VP Engineering, Lumen" },
              { quote: "The first tool our designers and engineers both love.", name: "Daniel Ortiz", role: "Head of Product, Orbit" },
              { quote: "Onboarding took an afternoon. Seriously.", name: "Priya Nair", role: "CTO, Halcyon" },
            ],
          },
        },
        {
          id: "pricing",
          type: "pricing",
          tone: "surface",
          props: {
            title: "Simple, transparent pricing",
            subtitle: "Start free. Upgrade when your team grows.",
            plans: [
              { name: "Starter", price: "$0", period: "month", description: "For individuals.", features: ["Up to 3 projects", "Basic automations", "Community support"], cta: { label: "Get started", href: "#" } },
              { name: "Team", price: "$12", period: "user / month", description: "For growing teams.", features: ["Unlimited projects", "Advanced automations", "Priority support", "SSO"], cta: { label: "Start trial", href: "#" }, highlighted: true },
              { name: "Enterprise", price: "Custom", description: "For large organisations.", features: ["Dedicated success manager", "Audit logs", "Custom contracts"], cta: { label: "Contact sales", href: "#" } },
            ],
          },
        },
        {
          id: "faq",
          type: "faq",
          variant: "accordion",
          props: {
            title: "Frequently asked questions",
            items: [
              { question: "Is there a free plan?", answer: "Yes — the Starter plan is free forever for individuals." },
              { question: "Can I import from other tools?", answer: "Aurora imports from all popular tools in a few clicks." },
              { question: "Is my data secure?", answer: "Data is encrypted at rest and in transit, and we're SOC 2 compliant." },
            ],
          },
        },
        {
          id: "cta",
          type: "cta",
          variant: "banner",
          tone: "primary",
          props: {
            title: "Ready to ship faster?",
            subtitle: "Join thousands of teams building with Aurora.",
            primaryCta: { label: "Start free trial", href: "#" },
            secondaryCta: { label: "Talk to sales", href: "#" },
          },
        },
        {
          id: "footer",
          type: "footer",
          variant: "columns",
          props: {
            brand: { name: "Aurora", tagline: "The calm workspace for product teams." },
            columns: [
              { title: "Product", links: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }, { label: "Changelog", href: "#" }] },
              { title: "Company", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Blog", href: "#" }] },
              { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
            ],
          },
        },
      ],
    },
  ],
};
