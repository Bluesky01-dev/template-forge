import { BrandMark, Container, LinkButton, SectionShell, cn } from "@tf/ui";
import type { SectionComponentProps } from "./types";

export function Navbar({ section, vars }: SectionComponentProps<"navbar">) {
  const { brand, links, cta } = section.props;
  const centered = section.variant === "centered";
  return (
    <SectionShell spacing="none" vars={vars} className="border-b border-border" data-section={section.id}>
      <Container className={cn("flex h-16 items-center gap-6", centered ? "justify-between md:grid md:grid-cols-3" : "justify-between")}>
        <a href="#" className="flex items-center gap-2">
          <BrandMark name={brand.name} logo={brand.logo} />
        </a>
        <nav aria-label="Main" className={cn("hidden items-center gap-6 text-sm md:flex", centered && "justify-center")}>
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
        <div className={cn("flex", centered && "md:justify-end")}>{cta && <LinkButton link={cta} size="sm" />}</div>
      </Container>
    </SectionShell>
  );
}
