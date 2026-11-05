import { describe, expect, it } from "vitest";
import { COLOR_TOKENS, SECTION_TYPES, Section, SiteDoc, TokenSet, deepMerge } from "./index";

const tokens = {
  mode: "light",
  colors: Object.fromEntries(COLOR_TOKENS.map((k) => [k, "#777777"])),
  fonts: { display: { family: "Inter" }, body: { family: "Inter" } },
};
const page = (sections: unknown[], slug = "/") => ({ id: slug === "/" ? "home" : slug.slice(1), slug, title: "x", sections });

describe("TokenSet", () => {
  it("requires every semantic color", () => {
    expect(TokenSet.safeParse(tokens).success).toBe(true);
    const { primary: _p, ...rest } = tokens.colors;
    expect(TokenSet.safeParse({ ...tokens, colors: rest }).success).toBe(false);
  });
});

describe("Section", () => {
  it("applies variant/tone defaults and rejects unknown types", () => {
    const s = Section.parse({ id: "h", type: "hero", props: { title: "Hi" } });
    expect(s).toMatchObject({ variant: "centered", tone: "default" });
    expect(Section.safeParse({ id: "x", type: "carousel", props: {} }).success).toBe(false);
    expect(SECTION_TYPES).toHaveLength(10);
  });
});

describe("SiteDoc", () => {
  const base = { version: 1, id: "s", name: "S", templateId: "t", meta: { title: "S" }, tokens };
  it("rejects duplicate section ids and slugs", () => {
    const hero = { id: "a", type: "hero", props: { title: "x" } };
    expect(SiteDoc.safeParse({ ...base, pages: [page([hero, hero])] }).success).toBe(false);
    expect(SiteDoc.safeParse({ ...base, pages: [page([hero]), page([hero])] }).success).toBe(false);
    expect(SiteDoc.safeParse({ ...base, pages: [page([hero]), page([hero], "/about")] }).success).toBe(true);
  });
});

describe("deepMerge", () => {
  it("merges objects, replaces arrays, deletes on null", () => {
    expect(deepMerge({ a: { b: 1, c: 2 }, list: [1, 2], gone: 1 }, { a: { b: 3 }, list: [9], gone: null })).toEqual({
      a: { b: 3, c: 2 },
      list: [9],
      gone: undefined,
    });
  });
});
