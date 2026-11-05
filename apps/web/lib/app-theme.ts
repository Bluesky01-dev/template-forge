import { generateTokens } from "@tf/tokens";

/** Theme for the Template Forge app chrome itself (dogfoods the token engine). */
export const appTokens = generateTokens({
  primary: "#5b5bd6",
  accent: "#0ea5e9",
  mode: "light",
  radius: "md",
  fonts: { display: { family: "Inter Tight", weights: [500, 600, 700] }, body: { family: "Inter" } },
});
