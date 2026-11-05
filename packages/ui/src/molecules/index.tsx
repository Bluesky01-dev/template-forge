import * as React from "react";
import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "../atoms/button";
import { Heading, Text } from "../atoms/typography";
import { Card } from "../atoms/layout";
import { Avatar, Icon, Media } from "../atoms/media";
import { Badge } from "../atoms/badge";

export interface LinkLike {
  label: string;
  href: string;
}

/** A CTA rendered as an anchor with button styling. */
export function LinkButton({ link, ...props }: { link: LinkLike } & Omit<ButtonProps, "asChild">) {
  return (
    <Button asChild {...props}>
      <a href={link.href}>{link.label}</a>
    </Button>
  );
}

export function CtaGroup({ primary, secondary, className }: { primary?: LinkLike; secondary?: LinkLike; className?: string }) {
  if (!primary && !secondary) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {primary && <LinkButton link={primary} size="lg" />}
      {secondary && <LinkButton link={secondary} size="lg" variant="outline" />}
    </div>
  );
}

export function FeatureCard({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description: string;
  icon?: string;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <span className="inline-flex size-10 items-center justify-center rounded-tf bg-primary text-primary-foreground">
        <Icon name={icon} />
      </span>
      <Heading as="h3" size="h3" className="text-surface-foreground">
        {title}
      </Heading>
      <Text size="sm" tone="muted">
        {description}
      </Text>
    </Card>
  );
}

export function FeatureRow({
  title,
  description,
  image,
  reverse,
}: {
  title: string;
  description: string;
  image?: { src: string; alt: string };
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
      <div className={cn("flex flex-col gap-3", reverse && "md:order-2")}>
        <Heading as="h3" size="h2" className="text-2xl sm:text-3xl">
          {title}
        </Heading>
        <Text tone="muted" size="lg">
          {description}
        </Text>
      </div>
      <Media src={image?.src} alt={image?.alt ?? title} />
    </div>
  );
}

export function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-4xl font-semibold tracking-tight">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function TestimonialCard({
  quote,
  name,
  role,
  avatar,
  large,
}: {
  quote: string;
  name: string;
  role?: string;
  avatar?: { src: string };
  large?: boolean;
}) {
  return (
    <figure className={cn("flex flex-col gap-5", !large && "rounded-tf border border-border bg-surface p-6 text-surface-foreground")}>
      <blockquote className={cn("font-display text-pretty", large ? "text-2xl leading-snug sm:text-3xl" : "text-base leading-relaxed")}>
        “{quote}”
      </blockquote>
      <figcaption className="flex items-center gap-3">
        <Avatar name={name} src={avatar?.src} />
        <span className="flex flex-col">
          <span className="text-sm font-semibold">{name}</span>
          {role && <span className="text-sm text-muted-foreground">{role}</span>}
        </span>
      </figcaption>
    </figure>
  );
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  highlighted,
}: {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  cta: LinkLike;
  highlighted?: boolean;
}) {
  return (
    <Card className={cn("relative flex flex-col gap-6", highlighted && "border-primary ring-2 ring-primary")}>
      {highlighted && (
        <Badge variant="primary" className="absolute -top-3 left-6">
          Most popular
        </Badge>
      )}
      <div className="flex flex-col gap-2">
        <Heading as="h3" size="h4" className="text-surface-foreground">
          {name}
        </Heading>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl font-semibold tracking-tight">{price}</span>
          {period && <span className="text-sm text-muted-foreground">/{period}</span>}
        </div>
        {description && (
          <Text size="sm" tone="muted">
            {description}
          </Text>
        )}
      </div>
      <ul className="flex flex-1 flex-col gap-2.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Icon name="check" className="mt-0.5 size-4 shrink-0 text-primary" />
            {f}
          </li>
        ))}
      </ul>
      <LinkButton link={cta} variant={highlighted ? "primary" : "outline"} className="w-full" />
    </Card>
  );
}

export function FaqItem({ question, answer, defaultOpen }: { question: string; answer: string; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-border py-5" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
        {question}
        <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <Text tone="muted" size="sm" className="mt-3">
        {answer}
      </Text>
    </details>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-4", align === "center" && "mx-auto items-center text-center")}>
      {eyebrow && <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</span>}
      <Heading>{title}</Heading>
      {subtitle && (
        <Text tone="muted" size="lg">
          {subtitle}
        </Text>
      )}
    </div>
  );
}
