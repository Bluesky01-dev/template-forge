/** Popular Google Fonts families (safe to request from fonts.googleapis.com). */
export const GOOGLE_FONTS = new Set(
  [
    "Inter", "Inter Tight", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Raleway", "Nunito", "Nunito Sans",
    "Work Sans", "DM Sans", "DM Serif Display", "Manrope", "Plus Jakarta Sans", "Space Grotesk", "Sora", "Outfit", "Urbanist",
    "Figtree", "Onest", "Geist", "Rubik", "Karla", "Mulish", "Barlow", "Archivo", "Epilogue", "Lexend", "Syne", "Bricolage Grotesque",
    "Playfair Display", "Fraunces", "Lora", "Merriweather", "Cormorant Garamond", "Cormorant", "EB Garamond", "Libre Baskerville",
    "Source Serif 4", "Instrument Serif", "Bodoni Moda", "Crimson Pro", "Newsreader", "Young Serif", "Josefin Sans", "Quicksand",
    "Oswald", "Bebas Neue", "Anton", "Archivo Black", "Unbounded", "Red Hat Display", "IBM Plex Sans", "IBM Plex Serif",
    "IBM Plex Mono", "JetBrains Mono", "Space Mono", "Source Sans 3", "PT Sans", "PT Serif", "Cabin", "Hind", "Heebo", "Assistant",
    "Albert Sans", "Public Sans", "Hanken Grotesk", "Schibsted Grotesk", "Familjen Grotesk", "Instrument Sans", "Libre Franklin",
  ].map((f) => f.toLowerCase()),
);

export const isGoogleFont = (family: string) => GOOGLE_FONTS.has(family.toLowerCase());

/** Families loaded via <link href="https://fonts.googleapis.com/css2?family=...">. */
export function googleFamiliesFromLinks(hrefs: string[]): string[] {
  const out: string[] = [];
  for (const href of hrefs) {
    if (!/fonts\.googleapis\.com/.test(href)) continue;
    try {
      const u = new URL(href, "https://x");
      for (const fam of u.searchParams.getAll("family")) {
        for (const f of fam.split("|")) out.push(f.split(":")[0]!.replace(/\+/g, " ").trim());
      }
    } catch {
      /* ignore */
    }
  }
  return out;
}
