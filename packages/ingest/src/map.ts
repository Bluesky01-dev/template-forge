import { classifyIndustry } from "@tf/brand";
import { Section, SiteDoc, STYLE_TAGS, TemplateManifest, type SectionInput, type TokenSet } from "@tf/schema";
import type { OutlineNode } from "./extract";

let counter = 0;
const uid = (base: string) => `${base}-${++counter}`;

const isPrice = (s: string) => /([$€£¥₹]\s?\d|\d+\s?(\/|per)\s?(mo|month|yr|year|user))/i.test(s) || /^(free|custom)$/i.test(s.trim());
const isStat = (s: string) => /^[~<>]?[\d.,]+\s?(k|m|b|\+|%|x|★|\/5|\/10)*\+?$/i.test(s.trim());
const isQuote = (s: string) => /^[“"']/.test(s.trim()) || s.length > 90;
const link = (n: OutlineNode) => ({ label: n.text.slice(0, 40), href: n.href ?? "#" });

interface Group {
  title?: OutlineNode;
  nodes: OutlineNode[];
}

/**
 * Deterministic mapping of a content outline onto the section taxonomy.
 * Good enough to get a usable first template; the AI mapper refines it.
 */
export function mapOutline(nodes: OutlineNode[], name: string): SectionInput[] {
  counter = 0;
  const sections: SectionInput[] = [];
  const h1i = nodes.findIndex((n) => n.kind === "h1");
  const footerI = nodes.findIndex((n) => n.kind === "footer");
  const before = h1i >= 0 ? nodes.slice(0, h1i) : [];
  const body = nodes.slice(h1i >= 0 ? h1i : 0, footerI > h1i ? footerI : undefined);
  const footer = footerI > h1i ? nodes.slice(footerI + 1) : [];

  /* navbar */
  const navLinks = before.filter((n) => n.kind === "link" && n.text.length < 24);
  const navCta = [...before].reverse().find((n) => n.kind === "button") ?? (navLinks.length > 3 ? navLinks.pop() : undefined);
  sections.push({
    id: "nav",
    type: "navbar",
    variant: "simple",
    props: { brand: { name }, links: navLinks.slice(0, 6).map(link), cta: navCta ? link(navCta) : undefined },
  });

  /* hero */
  const firstH2 = body.findIndex((n) => n.kind === "h2");
  const heroNodes = body.slice(0, firstH2 > 0 ? firstH2 : Math.min(body.length, 6));
  const h1 = heroNodes.find((n) => n.kind === "h1");
  const sub = heroNodes.find((n) => n.kind === "p");
  const ctas = heroNodes.filter((n) => n.kind === "button" || n.kind === "link").slice(0, 2);
  const heroImg = heroNodes.find((n) => n.kind === "img");
  const eyebrowCand = heroNodes.find((n) => (n.kind === "text" || n.kind === "p") && n !== sub && n.text.length < 40);
  sections.push({
    id: "hero",
    type: "hero",
    variant: heroImg ? "split" : "centered",
    props: {
      eyebrow: eyebrowCand?.text,
      title: h1?.text ?? name,
      subtitle: sub?.text,
      primaryCta: ctas[0] ? link(ctas[0]) : undefined,
      secondaryCta: ctas[1] ? link(ctas[1]) : undefined,
      image: heroImg ? { src: "", alt: heroImg.text } : undefined,
    },
  });

  /* body groups split on h2 */
  const groups: Group[] = [];
  for (const n of body.slice(firstH2 > 0 ? firstH2 : body.length)) {
    if (n.kind === "h2") groups.push({ title: n, nodes: [] });
    else groups.at(-1)?.nodes.push(n);
  }
  for (const g of groups) {
    const s = mapGroup(g);
    if (s) sections.push(s);
  }

  /* footer */
  const tagline = footer.find((n) => n.kind === "p" || n.kind === "text");
  const fLinks = footer.filter((n) => n.kind === "link").slice(0, 9);
  sections.push({
    id: "footer",
    type: "footer",
    variant: fLinks.length >= 4 ? "columns" : "simple",
    props: {
      brand: { name, tagline: tagline?.text.slice(0, 120) },
      columns: fLinks.length >= 4 ? [{ title: "Links", links: fLinks.map(link) }] : [],
    },
  });

  // Drop anything that doesn't validate rather than failing the whole import.
  return sections.filter((s) => Section.safeParse(s).success);
}

function mapGroup(g: Group): SectionInput | null {
  const title = g.title?.text ?? "";
  const h3s = g.nodes.filter((n) => n.kind === "h3");
  const ps = g.nodes.filter((n) => n.kind === "p" || n.kind === "text");
  const subtitle = g.nodes[0]?.kind === "p" ? g.nodes[0].text : undefined;
  const links = g.nodes.filter((n) => n.kind === "link" || n.kind === "button");
  const imgs = g.nodes.filter((n) => n.kind === "img");

  // pairs of heading + following paragraph
  const pairs: Array<{ title: string; text: string }> = [];
  g.nodes.forEach((n, i) => {
    if (n.kind !== "h3") return;
    const next = g.nodes.slice(i + 1).find((x) => x.kind === "p" || x.kind === "text" || x.kind === "h3");
    pairs.push({ title: n.text, text: next && next.kind !== "h3" ? next.text : "" });
  });

  if (/faq|question/i.test(title) || h3s.filter((h) => h.text.trim().endsWith("?")).length >= 2) {
    const items = pairs.filter((p) => p.text).map((p) => ({ question: p.title, answer: p.text }));
    if (items.length) return { id: uid("faq"), type: "faq", variant: "accordion", props: { title, subtitle, items } };
  }
  if (g.nodes.filter((n) => isPrice(n.text)).length >= 2) {
    const plans = pairs.slice(0, 4).map((p, i) => {
      const idx = g.nodes.findIndex((n) => n.text === p.title);
      const after = g.nodes.slice(idx + 1, idx + 12);
      const price = after.find((n) => isPrice(n.text))?.text ?? "$—";
      const features = after.filter((n) => n.kind === "text" && !isPrice(n.text)).map((n) => n.text).slice(0, 6);
      const cta = after.find((n) => n.kind === "button" || n.kind === "link");
      return { name: p.title, price, features, cta: cta ? link(cta) : { label: "Get started", href: "#" }, highlighted: i === 1 };
    });
    if (plans.length) return { id: uid("pricing"), type: "pricing", props: { title, subtitle, plans } };
  }
  if (/testimonial|review|say|love|customers/i.test(title) || ps.filter((p) => isQuote(p.text)).length >= 2) {
    const quotes = ps.filter((p) => isQuote(p.text));
    const items = quotes.slice(0, 6).map((q) => {
      const i = g.nodes.indexOf(q);
      const who = g.nodes.slice(i + 1, i + 3).filter((n) => n.text.length < 60);
      return { quote: q.text.replace(/^[“"']|[”"']$/g, ""), name: who[0]?.text ?? "Customer", role: who[1]?.text };
    });
    if (items.length) return { id: uid("testimonials"), type: "testimonials", variant: items.length === 1 ? "spotlight" : "grid", props: { title, items } };
  }
  const stats = g.nodes.filter((n) => isStat(n.text));
  if (stats.length >= 2) {
    const items = stats.slice(0, 6).map((s) => {
      const i = g.nodes.indexOf(s);
      return { value: s.text, label: g.nodes[i + 1]?.text.slice(0, 40) ?? "" };
    });
    return { id: uid("stats"), type: "stats", props: { title: title || undefined, items } };
  }
  if (/trusted|clients|partners|backed|featured|as seen/i.test(title)) {
    const logos = [...imgs, ...ps].filter((n) => n.text.length < 30).slice(0, 8).map((n) => ({ name: n.text }));
    if (logos.length) return { id: uid("logos"), type: "logo-cloud", props: { title, logos } };
  }
  if (pairs.length >= 2) {
    const alternating = imgs.length >= Math.min(2, pairs.length);
    return {
      id: uid("features"),
      type: "features",
      variant: alternating ? "alternating" : "grid",
      props: {
        title,
        subtitle,
        items: pairs.slice(0, 9).map((p, i) => ({
          title: p.title,
          description: p.text || " ",
          image: alternating ? { src: "", alt: imgs[i]?.text ?? p.title } : undefined,
        })),
      },
    };
  }
  if (title) {
    return {
      id: uid("cta"),
      type: "cta",
      variant: "banner",
      props: { title, subtitle, primaryCta: links[0] ? link(links[0]) : { label: "Get started", href: "#" }, secondaryCta: links[1] ? link(links[1]) : undefined },
    };
  }
  return null;
}

/** Give bands visual rhythm like a designed template would. */
export function assignTones(sections: SectionInput[]): SectionInput[] {
  let alt = false;
  return sections.map((s) => {
    if (s.type === "navbar" || s.type === "footer" || s.type === "hero") return s;
    if (s.type === "cta") return { ...s, tone: "primary" };
    alt = !alt;
    return { ...s, tone: alt ? "default" : "surface" };
  });
}

export function inferManifest(opts: {
  id: string;
  name: string;
  description?: string;
  tokens: TokenSet;
  doc: SiteDoc;
  nodes: OutlineNode[];
  sourceUrl?: string;
  license?: string;
  industries?: string[];
}): TemplateManifest {
  const corpus = opts.nodes.map((n) => n.text).join(" ");
  const { scores } = classifyIndustry(corpus);
  const industries =
    opts.industries?.length ? opts.industries : Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k);
  const serif = /serif|garamond|playfair|fraunces|lora|baskerville|bodoni|cormorant/i.test(opts.tokens.fonts.display.family);
  const styles = new Set<(typeof STYLE_TAGS)[number]>();
  if (opts.tokens.mode === "dark") styles.add("bold");
  if (serif) styles.add("editorial");
  if (opts.tokens.radius === "xl" || opts.tokens.radius === "full") styles.add("playful");
  if (styles.size === 0) styles.add("minimal");
  const words = corpus.split(/\s+/).length;
  const imgs = opts.nodes.filter((n) => n.kind === "img").length;
  return TemplateManifest.parse({
    id: opts.id,
    name: opts.name,
    description: opts.description ?? `${opts.name} — imported template`,
    source: { kind: "framer", url: opts.sourceUrl, license: opts.license },
    industries: industries.length ? industries : ["general"],
    mood: { mode: opts.tokens.mode, styles: [...styles] },
    sections: [...new Set(opts.doc.pages.flatMap((p) => p.sections.map((s) => s.type)))],
    capacity: { copy: words < 250 ? "light" : words < 700 ? "medium" : "heavy", images: imgs < 3 ? "few" : imgs < 8 ? "some" : "many" },
    defaultTokens: opts.tokens,
  });
}
