import { Badge, Container, CtaGroup, Heading, Media, SectionShell, Text } from "@tf/ui";
import type { SectionComponentProps } from "./types";

export function Hero({ section, vars }: SectionComponentProps<"hero">) {
  const { eyebrow, title, subtitle, primaryCta, secondaryCta, image } = section.props;
  if (section.variant === "split")
    return (
      <SectionShell vars={vars} spacing="lg" data-section={section.id}>
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-6">
            {eyebrow && <Badge variant="outline">{eyebrow}</Badge>}
            <Heading as="h1" size="display">
              {title}
            </Heading>
            {subtitle && (
              <Text size="lg" tone="muted" className="max-w-xl">
                {subtitle}
              </Text>
            )}
            <CtaGroup primary={primaryCta} secondary={secondaryCta} />
          </div>
          <Media src={image?.src} alt={image?.alt ?? ""} ratio="aspect-[5/4]" />
        </Container>
      </SectionShell>
    );
  return (
    <SectionShell vars={vars} spacing="lg" data-section={section.id}>
      <Container className="flex flex-col items-center gap-6 text-center">
        {eyebrow && <Badge variant="outline">{eyebrow}</Badge>}
        <Heading as="h1" size="display" className="max-w-4xl">
          {title}
        </Heading>
        {subtitle && (
          <Text size="lg" tone="muted" className="max-w-2xl">
            {subtitle}
          </Text>
        )}
        <CtaGroup primary={primaryCta} secondary={secondaryCta} className="justify-center" />
        {image && <Media src={image.src} alt={image.alt} ratio="aspect-video" className="mt-10 max-w-5xl" />}
      </Container>
    </SectionShell>
  );
}
