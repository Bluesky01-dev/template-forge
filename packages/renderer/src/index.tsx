import * as React from "react";
import type { Section, SectionType, SiteDoc, TokenSet } from "@tf/schema";
import { registry, type SectionComponent } from "@tf/sections";
import { googleFontsHref, toneVars, tokensToCssVars } from "@tf/tokens";

/** Scopes a TokenSet to a subtree, so several themes can render side by side. */
export function ThemeScope({
  tokens,
  children,
  className,
}: {
  tokens: TokenSet;
  children: React.ReactNode;
  className?: string;
}) {
  const href = googleFontsHref(tokens);
  return (
    <div
      className={className}
      data-tf-mode={tokens.mode}
      style={{ ...(tokensToCssVars(tokens) as React.CSSProperties), background: "var(--tf-background)", color: "var(--tf-foreground)", fontFamily: "var(--tf-font-body)" }}
    >
      {/* React 19 hoists this into <head> and de-duplicates by href */}
      {href && <link rel="stylesheet" href={href} precedence="default" />}
      {children}
    </div>
  );
}

export function SectionView({ section, tokens }: { section: Section; tokens: TokenSet }) {
  const Comp = registry[section.type] as SectionComponent<SectionType>;
  if (!Comp) return null;
  return <Comp section={section as never} vars={toneVars(tokens, section.tone)} />;
}

export function SiteRenderer({ doc, slug = "/" }: { doc: SiteDoc; slug?: string }) {
  const page = doc.pages.find((p) => p.slug === slug) ?? doc.pages[0]!;
  return (
    <ThemeScope tokens={doc.tokens}>
      {page.sections.map((s) => (
        <SectionView key={s.id} section={s} tokens={doc.tokens} />
      ))}
    </ThemeScope>
  );
}
