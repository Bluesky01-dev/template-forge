import { describe, expect, it } from "vitest";
import { applyOps, SECTION_VARIANTS } from "@tf/schema";
import { checkContrast } from "@tf/tokens";
import { templates } from "./index";

describe("template library", () => {
  it("loads all templates", () => expect(templates.length).toBeGreaterThanOrEqual(3));

  for (const t of templates) {
    it(`${t.manifest.id}: manifest sections match the doc`, () => {
      const used = new Set(t.doc.pages.flatMap((p) => p.sections.map((s) => s.type)));
      for (const s of used) expect(t.manifest.sections).toContain(s);
    });
    it(`${t.manifest.id}: default tokens pass contrast`, () => {
      expect(checkContrast(t.manifest.defaultTokens).filter((r) => !r.pass)).toEqual([]);
    });
  }
});

describe("applyOps", () => {
  const doc = templates[0]!.doc;

  it("applies a batch atomically", () => {
    const r = applyOps(doc, [
      { op: "set_tokens", radius: "full" },
      { op: "update_props", pageId: "home", sectionId: "hero", props: { title: "Hello" } },
      { op: "set_variant", pageId: "home", sectionId: "hero", variant: "split" },
      { op: "move_section", pageId: "home", sectionId: "faq", toIndex: 1 },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const hero = r.doc.pages[0]!.sections.find((s) => s.id === "hero")!;
    expect(hero.variant).toBe("split");
    expect((hero.props as { title: string }).title).toBe("Hello");
    expect(r.doc.pages[0]!.sections[1]!.id).toBe("faq");
    expect(r.doc.tokens.radius).toBe("full");
    // original untouched
    expect(doc.tokens.radius).not.toBe("full");
  });

  it("rejects an invalid variant without changing anything", () => {
    const r = applyOps(doc, [
      { op: "set_tokens", radius: "full" },
      { op: "set_variant", pageId: "home", sectionId: "hero", variant: "diagonal" },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.opIndex).toBe(1);
  });

  it("rejects unknown sections and duplicate ids", () => {
    expect(applyOps(doc, [{ op: "remove_section", pageId: "home", sectionId: "nope" }]).ok).toBe(false);
    const dup = doc.pages[0]!.sections[0]!;
    expect(applyOps(doc, [{ op: "add_section", pageId: "home", section: dup }]).ok).toBe(false);
  });

  it("adds a valid section with defaults", () => {
    const r = applyOps(doc, [
      { op: "add_section", pageId: "home", index: 2, section: { id: "cta2", type: "cta", props: { title: "Hi", primaryCta: { label: "Go" } } } },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.pages[0]!.sections[2]).toMatchObject({ id: "cta2", variant: "banner", tone: "default" });
  });

  it("exposes variants per section", () => {
    expect(SECTION_VARIANTS.hero).toEqual(["centered", "split"]);
  });
});
