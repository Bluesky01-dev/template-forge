import { SiteDoc, type BrandProfile, type Section } from "@tf/schema";
import type { BrandInput } from "@tf/tokens";
import type { LibraryTemplate } from "@tf/templates";
import { themeTemplate } from "./theme";

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 48) || "site"
  );
}

const fits = (s: string | undefined, min: number, max: number) => !!s && s.length >= min && s.length <= max;

/**
 * Template + brand -> first draft SiteDoc. Deterministic: swaps brand name,
 * theme, logo, headline and services into the template. The chat agent then
 * refines copy with the client's real content.
 */
export function buildSite(
  template: LibraryTemplate,
  profile: BrandProfile,
  brand: BrandInput,
  opts: { id?: string } = {},
): SiteDoc {
  const name = profile.name?.trim() || new URL(profile.url).hostname.replace(/^www\./, "");
  const doc = structuredClone(template.doc);
  const logo =
    profile.logo && !/favicon|\.ico($|\?)/i.test(profile.logo) ? { src: profile.logo, alt: `${name} logo` } : undefined;
  const services = profile.content.services;

  doc.id = opts.id ?? `${slugify(name)}-${template.manifest.id}`;
  doc.name = name;
  doc.templateId = template.manifest.id;
  doc.tokens = themeTemplate(template.manifest, brand);
  doc.meta = {
    title: profile.content.headline ? `${name} — ${profile.content.headline}`.slice(0, 90) : name,
    description: profile.content.summary ?? doc.meta.description,
  };

  for (const page of doc.pages) {
    page.sections = page.sections.map((s): Section => {
      switch (s.type) {
        case "navbar":
          return { ...s, props: { ...s.props, brand: { name, logo } } };
        case "footer":
          return {
            ...s,
            props: { ...s.props, brand: { ...s.props.brand, name }, copyright: undefined },
          };
        case "hero":
          return {
            ...s,
            props: {
              ...s.props,
              eyebrow: undefined,
              title: fits(profile.content.headline, 8, 110) ? profile.content.headline! : s.props.title,
              subtitle: fits(profile.content.summary, 20, 260) ? profile.content.summary : s.props.subtitle,
            },
          };
        case "features": {
          if (services.length < 3) return s;
          const n = Math.min(Math.max(s.props.items.length, 3), services.length, 6);
          const items = services.slice(0, n).map((title, i) => {
            const base = s.props.items[i % s.props.items.length]!;
            return { ...base, title, description: `A short description of ${title.toLowerCase()} for ${name} customers.` };
          });
          return { ...s, props: { ...s.props, items } };
        }
        default:
          return s;
      }
    });
  }
  return SiteDoc.parse(doc);
}
