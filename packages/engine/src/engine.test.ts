import { describe, expect, it } from "vitest";
import { analyzeSite } from "@tf/brand";
import { templates } from "@tf/templates";
import { checkContrast } from "@tf/tokens";
import { buildSite, rankTemplates, slugify } from "./index";

const site = (title: string, body: string, css: string) => ({ url: "https://client.example/", html: `<title>${title}</title><body>${body}</body>`, css: [css] });

const TRADES = analyzeSite(
  site(
    "Volt Electrical | Licensed electricians",
    "<h1>Licensed electricians you can trust</h1><h3>Repairs</h3><h3>Switchboards</h3><h3>Lighting</h3><h3>Solar</h3><p>Book now. Read our reviews. Electrical installation and repairs by a licensed electrician. Call us. FAQ.</p>",
    "body{background:#fff;color:#111} .btn{background:#0057ff}",
  ),
);
const SAAS = analyzeSite(
  site(
    "Flowly — Workflow automation software",
    "<h1>Automate your workflow</h1><p>SaaS platform with integrations, API and dashboard. Start a free trial. Pricing plans per month. Trusted by teams. Enterprise secure.</p>",
    "body{background:#fff} :root{--primary:#7c3aed}",
  ),
);
const STUDIO = analyzeSite(
  site(
    "Mono — Independent design studio",
    "<h1>Bold brands for brave companies</h1><h2>Selected work</h2><p>Branding agency. Case studies. Our clients. We refuse to blend in. Creative studio.</p>",
    "html{background:#0a0a0a;color:#fafafa} :root{--brand:#ff3d00}",
  ),
);

describe("rankTemplates", () => {
  it("ranks the matching template first for each kind of business", () => {
    expect(rankTemplates(TRADES.profile, TRADES.input, templates)[0]!.templateId).toBe("harvest");
    expect(rankTemplates(SAAS.profile, SAAS.input, templates)[0]!.templateId).toBe("aurora");
    expect(rankTemplates(STUDIO.profile, STUDIO.input, templates)[0]!.templateId).toBe("noir");
  });

  it("returns scores 0-100 with reasons and contrast-safe tokens", () => {
    const r = rankTemplates(SAAS.profile, SAAS.input, templates);
    for (const t of r) {
      expect(t.score).toBeGreaterThanOrEqual(0);
      expect(t.score).toBeLessThanOrEqual(100);
      expect(checkContrast(t.tokens).every((c) => c.pass)).toBe(true);
    }
    expect(r[0]!.reasons.length).toBeGreaterThan(0);
    expect(r[0]!.score).toBeGreaterThan(r[2]!.score);
  });
});

describe("buildSite", () => {
  it("personalizes a template with the brand", () => {
    const tpl = templates.find((t) => t.manifest.id === "harvest")!;
    const doc = buildSite(tpl, TRADES.profile, TRADES.input);
    const sections = doc.pages[0]!.sections;
    const nav = sections.find((s) => s.type === "navbar")!;
    expect(nav.props).toMatchObject({ brand: { name: "Volt Electrical" } });
    const hero = sections.find((s) => s.type === "hero")!;
    expect(hero.props).toMatchObject({ title: "Licensed electricians you can trust" });
    const features = sections.find((s) => s.type === "features")!;
    expect((features.props as { items: { title: string }[] }).items.map((i) => i.title)).toContain("Switchboards");
    expect(doc.tokens.colors.primary).not.toBe(tpl.doc.tokens.colors.primary);
    expect(doc.id).toBe("volt-electrical-harvest");
  });

  it("slugifies", () => expect(slugify("  Joe's Café & Bar! ")).toBe("joes-cafe-bar"));
});
