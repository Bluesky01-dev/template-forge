import { describe, expect, it } from "vitest";
import { checkContrast, generateTokens, googleFontsHref, tokensToCssVars } from "./generate";

const BRANDS = ["#ff5a1f", "#ffd400", "#0a2540", "#7c3aed", "#10b981", "#ffffff", "#000000", "#e11d48"];

describe("generateTokens", () => {
  for (const primary of BRANDS) {
    for (const mode of ["light", "dark"] as const) {
      it(`passes every contrast pair for ${primary} (${mode})`, () => {
        const t = generateTokens({ primary, mode });
        const failing = checkContrast(t).filter((r) => !r.pass);
        expect(failing).toEqual([]);
      });
    }
  }

  it("keeps the brand primary color", () => {
    const t = generateTokens({ primary: "#7c3aed" });
    expect(t.colors.primary).toMatch(/^oklch\(/);
  });

  it("emits css vars and font url", () => {
    const t = generateTokens({ primary: "#0a2540", fonts: { display: { family: "Playfair Display", weights: [600] } } });
    const vars = tokensToCssVars(t);
    expect(vars["--tf-primary"]).toBe(t.colors.primary);
    expect(googleFontsHref(t)).toContain("family=Playfair+Display:wght@600");
  });
});

import { toneVars } from "./generate";
import { contrast } from "./color";

describe("toneVars", () => {
  for (const primary of BRANDS) {
    it(`keeps text readable on every tone for ${primary}`, () => {
      const t = generateTokens({ primary });
      for (const tone of ["surface", "primary", "inverted"] as const) {
        const v = toneVars(t, tone);
        expect(contrast(v["--tf-foreground"]!, v["--tf-background"]!)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(v["--tf-muted-foreground"]!, v["--tf-background"]!)).toBeGreaterThanOrEqual(4.49);
      }
    });
  }
});
