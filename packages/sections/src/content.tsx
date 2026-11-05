import {
  Container,
  CtaGroup,
  FaqItem,
  FeatureCard,
  FeatureRow,
  Heading,
  PricingCard,
  SectionHeader,
  SectionShell,
  StatItem,
  TestimonialCard,
  Text,
  cn,
} from "@tf/ui";
import type { SectionComponentProps } from "./types";

export function LogoCloud({ section, vars }: SectionComponentProps<"logo-cloud">) {
  const { title, logos } = section.props;
  return (
    <SectionShell vars={vars} spacing="sm" data-section={section.id}>
      <Container className="flex flex-col items-center gap-8">
        {title && <Text size="sm" tone="muted">{title}</Text>}
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map((l) => (
            <li key={l.name} className="font-display text-lg font-semibold tracking-tight text-muted-foreground">
              {l.src ? <img src={l.src} alt={l.name} className="h-7 w-auto opacity-70 grayscale" /> : l.name}
            </li>
          ))}
        </ul>
      </Container>
    </SectionShell>
  );
}

export function Features({ section, vars }: SectionComponentProps<"features">) {
  const { eyebrow, title, subtitle, items } = section.props;
  return (
    <SectionShell vars={vars} data-section={section.id}>
      <Container className="flex flex-col gap-14">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
        {section.variant === "alternating" ? (
          <div className="flex flex-col gap-20">
            {items.map((it, i) => (
              <FeatureRow key={it.title} title={it.title} description={it.description} image={it.image} reverse={i % 2 === 1} />
            ))}
          </div>
        ) : (
          <div className={cn("grid gap-6 sm:grid-cols-2", items.length % 3 === 0 && "lg:grid-cols-3")}>
            {items.map((it) => (
              <FeatureCard key={it.title} {...it} />
            ))}
          </div>
        )}
      </Container>
    </SectionShell>
  );
}

export function Stats({ section, vars }: SectionComponentProps<"stats">) {
  const { title, items } = section.props;
  return (
    <SectionShell vars={vars} spacing="sm" data-section={section.id}>
      <Container className="flex flex-col gap-10">
        {title && <Heading className="text-center">{title}</Heading>}
        <div className="grid grid-cols-2 gap-8 text-center md:grid-flow-col md:auto-cols-fr">
          {items.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </Container>
    </SectionShell>
  );
}

export function Testimonials({ section, vars }: SectionComponentProps<"testimonials">) {
  const { title, items } = section.props;
  if (section.variant === "spotlight") {
    const [first] = items;
    return (
      <SectionShell vars={vars} data-section={section.id}>
        <Container className="max-w-3xl">
          {first && <TestimonialCard {...first} large />}
        </Container>
      </SectionShell>
    );
  }
  return (
    <SectionShell vars={vars} data-section={section.id}>
      <Container className="flex flex-col gap-12">
        {title && <SectionHeader title={title} />}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <TestimonialCard key={t.name + t.quote.slice(0, 12)} {...t} />
          ))}
        </div>
      </Container>
    </SectionShell>
  );
}

export function Pricing({ section, vars }: SectionComponentProps<"pricing">) {
  const { title, subtitle, plans } = section.props;
  return (
    <SectionShell vars={vars} data-section={section.id}>
      <Container className="flex flex-col gap-14">
        <SectionHeader title={title} subtitle={subtitle} />
        <div className={cn("mx-auto grid w-full gap-6", plans.length >= 3 ? "max-w-6xl md:grid-cols-3" : "max-w-3xl md:grid-cols-2")}>
          {plans.map((p) => (
            <PricingCard key={p.name} {...p} />
          ))}
        </div>
      </Container>
    </SectionShell>
  );
}

export function Faq({ section, vars }: SectionComponentProps<"faq">) {
  const { title, subtitle, items } = section.props;
  const twoCol = section.variant === "two-column";
  return (
    <SectionShell vars={vars} data-section={section.id}>
      <Container className={cn("flex flex-col gap-10", twoCol && "lg:grid lg:grid-cols-[1fr_1.4fr] lg:gap-16")}>
        <SectionHeader title={title} subtitle={subtitle} align={twoCol ? "left" : "center"} />
        <div className={cn("w-full", !twoCol && "mx-auto max-w-3xl")}>
          {items.map((f, i) => (
            <FaqItem key={f.question} {...f} defaultOpen={i === 0} />
          ))}
        </div>
      </Container>
    </SectionShell>
  );
}

export function Cta({ section, vars }: SectionComponentProps<"cta">) {
  const { title, subtitle, primaryCta, secondaryCta } = section.props;
  if (section.variant === "split")
    return (
      <SectionShell vars={vars} data-section={section.id}>
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex max-w-2xl flex-col gap-3">
            <Heading>{title}</Heading>
            {subtitle && <Text tone="muted" size="lg">{subtitle}</Text>}
          </div>
          <CtaGroup primary={primaryCta} secondary={secondaryCta} />
        </Container>
      </SectionShell>
    );
  return (
    <SectionShell vars={vars} data-section={section.id}>
      <Container className="flex flex-col items-center gap-6 text-center">
        <Heading className="max-w-3xl">{title}</Heading>
        {subtitle && <Text tone="muted" size="lg" className="max-w-2xl">{subtitle}</Text>}
        <CtaGroup primary={primaryCta} secondary={secondaryCta} className="justify-center" />
      </Container>
    </SectionShell>
  );
}

export function Footer({ section, vars }: SectionComponentProps<"footer">) {
  const { brand, columns, copyright } = section.props;
  const year = new Date().getFullYear();
  return (
    <SectionShell vars={vars} spacing="sm" className="border-t border-border" data-section={section.id}>
      <Container className="flex flex-col gap-10">
        <div className={cn("flex flex-col gap-10", section.variant === "columns" && "md:flex-row md:justify-between")}>
          <div className="flex max-w-xs flex-col gap-2">
            <span className="font-display text-lg font-semibold">{brand.name}</span>
            {brand.tagline && <Text size="sm" tone="muted">{brand.tagline}</Text>}
          </div>
          {columns.length > 0 && (
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {columns.map((c) => (
                <div key={c.title} className="flex flex-col gap-3 text-sm">
                  <span className="font-semibold">{c.title}</span>
                  {c.links.map((l) => (
                    <a key={l.label} href={l.href} className="text-muted-foreground hover:text-foreground">
                      {l.label}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <Text size="sm" tone="muted">{copyright ?? `© ${year} ${brand.name}. All rights reserved.`}</Text>
      </Container>
    </SectionShell>
  );
}
