import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkContrast } from "@tf/tokens";
import { ingest } from "./ingest";
import { colorHitsFromCode, fontsFromCode } from "./extract";

const here = dirname(fileURLToPath(import.meta.url));

describe("extract", () => {
  it("reads Framer token fallbacks, JS styles and GF font ids", () => {
    const hits = colorHitsFromCode(`{"--token-abc-primary": "rgb(255, 92, 53)", backgroundColor: "var(--token-x, rgb(1, 2, 3))"}`);
    expect(hits.map((h) => h.hex)).toEqual(expect.arrayContaining(["#ff5c35", "#010203"]));
    expect(hits.find((h) => h.hex === "#ff5c35")?.hint).toBe("primary");
    expect([...fontsFromCode(`fontFamily: '"GF;Fraunces-600"'`).keys()]).toContain("Fraunces");
  });
});

describe("ingest (heuristic)", () => {
  it("maps a Framer-style Next.js export onto sections", async () => {
    const { manifest, doc, report } = await ingest({ dir: join(here, "../fixtures/framer-next"), id: "carely" });
    const types = doc.pages[0]!.sections.map((s) => s.type);
    expect(types[0]).toBe("navbar");
    expect(types[1]).toBe("hero");
    expect(types).toEqual(expect.arrayContaining(["features", "stats", "testimonials", "pricing", "faq", "cta", "footer"]));
    const hero = doc.pages[0]!.sections[1]!;
    expect(hero.props).toMatchObject({ title: "Modern care, booked in seconds", primaryCta: { label: "Book a demo" } });
    expect(hero.variant).toBe("split");
    const nav = doc.pages[0]!.sections[0]!;
    expect(nav.props).toMatchObject({ links: [{ label: "Features" }, { label: "Pricing" }, { label: "FAQ" }], cta: { label: "Get started" } });
    expect(manifest.defaultTokens.mode).toBe("light");
    expect(manifest.industries).toContain("health");
    expect(doc.tokens.fonts.display.family).toBe("Fraunces");
    expect(report.contrast.every((c) => c.pass)).toBe(true);
    const pricing = doc.pages[0]!.sections.find((s) => s.type === "pricing")!;
    expect((pricing.props as { plans: { price: string }[] }).plans.map((p) => p.price)).toEqual(["$29/mo", "$79/mo", "Custom"]);
  });

  it("maps an Astro site with styles and alternating projects", async () => {
    const { manifest, doc } = await ingest({ dir: join(here, "../fixtures/astro-site"), id: "lume", name: "Studio Lume" });
    const features = doc.pages[0]!.sections.find((s) => s.type === "features")!;
    expect(features.variant).toBe("alternating");
    expect(doc.tokens.fonts.display.family).toBe("Cormorant Garamond");
    expect(manifest.mood.styles).toContain("editorial");
    expect(checkContrast(manifest.defaultTokens).every((c) => c.pass)).toBe(true);
  });
});
