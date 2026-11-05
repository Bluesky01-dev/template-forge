import type { Meta, StoryObj } from "@storybook/react-vite";
import { CtaGroup, FaqItem, FeatureCard, FeatureRow, PricingCard, SectionHeader, StatItem, TestimonialCard } from "@tf/ui";

const meta: Meta = { title: "Molecules/Components", decorators: [(S) => <div className="mx-auto max-w-5xl p-8"><S /></div>] };
export default meta;

export const Header: StoryObj = {
  name: "SectionHeader",
  render: () => <SectionHeader eyebrow="Features" title="Everything you need" subtitle="Thoughtful tools that remove friction." />,
};
export const Ctas: StoryObj = {
  name: "CtaGroup",
  render: () => <CtaGroup primary={{ label: "Start free", href: "#" }} secondary={{ label: "Book a demo", href: "#" }} />,
};
export const Feature: StoryObj = {
  name: "FeatureCard",
  render: () => (
    <div className="grid gap-6 sm:grid-cols-3">
      <FeatureCard title="Instant setup" description="Import your work in minutes." icon="bolt" />
      <FeatureCard title="Secure" description="SSO and audit logs built in." icon="shield" />
      <FeatureCard title="Insights" description="Dashboards that update live." icon="chart" />
    </div>
  ),
};
export const FeatureRowStory: StoryObj = {
  name: "FeatureRow",
  render: () => <FeatureRow title="Maison — a heritage brand, reborn" description="Identity overhaul and relaunch that lifted sales 3×." />,
};
export const Stat: StoryObj = {
  name: "StatItem",
  render: () => (
    <div className="flex gap-12">
      <StatItem value="12k+" label="Teams" />
      <StatItem value="99.99%" label="Uptime" />
    </div>
  ),
};
export const Testimonial: StoryObj = {
  name: "TestimonialCard",
  render: () => (
    <div className="grid gap-8">
      <TestimonialCard quote="We cut our release cycle in half." name="Maya Chen" role="VP Engineering" />
      <TestimonialCard quote="They gave us the confidence to own our category." name="Elena Rossi" role="Founder" large />
    </div>
  ),
};
export const Pricing: StoryObj = {
  name: "PricingCard",
  render: () => (
    <div className="grid gap-6 md:grid-cols-2">
      <PricingCard name="Starter" price="$0" period="month" features={["3 projects", "Community support"]} cta={{ label: "Get started", href: "#" }} />
      <PricingCard name="Team" price="$12" period="user / month" features={["Unlimited projects", "SSO"]} cta={{ label: "Start trial", href: "#" }} highlighted />
    </div>
  ),
};
export const Faq: StoryObj = {
  name: "FaqItem",
  render: () => (
    <div>
      <FaqItem question="Is there a free plan?" answer="Yes, free forever for individuals." defaultOpen />
      <FaqItem question="Can I import data?" answer="In a few clicks." />
    </div>
  ),
};
