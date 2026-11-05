import { templates } from "@tf/templates";
import { generateTokens } from "@tf/tokens";
import type { TokenSet } from "@tf/schema";

/** Toolbar themes: every library template's tokens + a few brand stress tests. */
export const THEMES: Record<string, TokenSet> = {
  ...Object.fromEntries(templates.map((t) => [t.manifest.id, t.manifest.defaultTokens])),
  "brand: orange light": generateTokens({ primary: "#f97316", mode: "light" }),
  "brand: yellow dark": generateTokens({ primary: "#ffd400", mode: "dark", radius: "full" }),
  "brand: navy serif": generateTokens({
    primary: "#0a2540",
    accent: "#e11d48",
    fonts: { display: { family: "Playfair Display" }, body: { family: "Source Sans 3" } },
  }),
};
