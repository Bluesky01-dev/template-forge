import { describe, expect, it } from "vitest";
import { checkContrast, generateTokens } from "@tf/tokens";
import { analyzeSite } from "./analyze";
import { assertPublicUrl, fetchSite } from "./fetch";

const ELECTRICIAN = {
  url: "https://sparkyco.example/",
  html: `<!doctype html><html><head>
    <title>Sparky Co | Licensed Electricians in Brisbane</title>
    <meta name="description" content="Licensed electrician for homes and businesses. Fast repairs, installation and free quotes.">
    <meta name="theme-color" content="#f97316">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Open+Sans&display=swap">
    <link rel="icon" href="/favicon.png">
  </head><body>
    <header><img src="/img/sparky-logo.svg" alt="Sparky Co logo"></header>
    <h1>Brisbane's trusted electricians</h1>
    <h2>Our services</h2><h3>Electrical repairs</h3><h3>Switchboard upgrades</h3><h3>Lighting installation</h3>
    <h2>What our customers say</h2><p>Rated 4.9 from 300+ reviews. Book now for same-day service. Call us today.</p>
    <a class="btn" style="background:#f97316;color:#fff">Get a free quote</a>
  </body></html>`,
  css: [`
    :root { --brand-primary: #f97316; --color-secondary: #1e3a8a; }
    body { background-color: #ffffff; color: #1f2937; font-family: "Open Sans", sans-serif; }
    h1, h2, h3 { font-family: 'Poppins', sans-serif; }
    .btn, button { background-color: #f97316; color: white; }
    .nav { background: #1e3a8a; }
    .footer { background: #1e3a8a; color: #cbd5e1; }
    .badge { background: #facc15; }
  `],
};

const AGENCY = {
  url: "https://studio.example/",
  html: `<html><head><title>Kova — Independent design studio</title>
    <meta property="og:site_name" content="Kova Studio"></head>
    <body><h1>We design brands people remember</h1>
    <h2>Selected work</h2><h2>Our clients</h2><p>Branding, identity and creative direction. See our case studies.</p></body></html>`,
  css: [`
    html { background: #0b0b0f; color: #f4f4f5; }
    :root { --accent: #a3e635; --primary: #8b5cf6; }
    .display { font-family: "Syne", sans-serif; }
    body { font-family: Inter, system-ui, sans-serif; }
    a.button { background: #8b5cf6; }
  `],
};

describe("analyzeSite", () => {
  it("extracts a light trades brand", () => {
    const a = analyzeSite(ELECTRICIAN);
    expect(a.profile.name).toBe("Sparky Co");
    expect(a.input.primary).toBe("#f97316");
    expect(a.input.secondary).toBe("#1e3a8a");
    expect(a.input.mode).toBe("light");
    expect(a.profile.fonts).toEqual({ display: "Poppins", body: "Open Sans" });
    expect(a.input.fonts?.display?.google).toBe(true);
    expect(a.profile.industry).toBe("trades");
    expect(a.profile.logo).toBe("https://sparkyco.example/img/sparky-logo.svg");
    expect(a.profile.content.needs).toEqual(expect.arrayContaining(["testimonials", "booking", "contact"]));
    expect(a.profile.content.services).toContain("Switchboard upgrades");
    expect(a.profile.content.services).not.toContain("Our services");
    expect(a.profile.content.services).not.toContain("What our customers say");
  });

  it("extracts a dark agency brand", () => {
    const a = analyzeSite(AGENCY);
    expect(a.profile.name).toBe("Kova Studio");
    expect(a.input.mode).toBe("dark");
    expect(a.input.primary).toBe("#8b5cf6");
    expect(a.input.accent).toBe("#a3e635");
    expect(a.profile.fonts.display).toBe("Syne");
    expect(a.profile.industry).toBe("agency");
    expect(a.profile.content.needs).toContain("portfolio");
  });

  it("produces tokens that pass contrast", () => {
    for (const site of [ELECTRICIAN, AGENCY]) {
      const t = generateTokens(analyzeSite(site).input);
      expect(checkContrast(t).filter((r) => !r.pass)).toEqual([]);
    }
  });

  it("falls back gracefully on an empty page", () => {
    const a = analyzeSite({ url: "https://empty.example/", html: "<html></html>", css: [] });
    expect(a.input.primary).toMatch(/^#/);
    expect(a.profile.colors).toEqual([]);
  });
});

describe("css variable roles", () => {
  it("treats --brand-accent as accent, not primary", () => {
    const a = analyzeSite({
      url: "https://x.example/",
      html: "<html></html>",
      css: [":root{--brand-primary:#0b5fff;--brand-accent:#ffb800} .nav{background:#0a1f44}"],
    });
    expect(a.input.primary).toBe("#0b5fff");
    expect(a.input.accent).toBe("#ffb800");
  });
});

describe("fetchSite", () => {
  it("fetches html and linked css through an injected fetcher", async () => {
    const pages: Record<string, string> = {
      "https://x.example/": `<link rel="stylesheet" href="/a.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">`,
      "https://x.example/a.css": "body{color:#111}",
    };
    const fetcher = (async (u: string) => new Response(pages[u] ?? "", { status: pages[u] ? 200 : 404 })) as unknown as typeof fetch;
    const snap = await fetchSite("https://x.example/", { fetcher });
    expect(snap.css).toEqual(["body{color:#111}"]);
  });

  it("blocks private addresses", () => {
    expect(() => assertPublicUrl("http://127.0.0.1/")).toThrow();
    expect(() => assertPublicUrl("file:///etc/passwd")).toThrow();
    expect(() => assertPublicUrl("http://192.168.1.2")).toThrow();
    expect(assertPublicUrl("https://example.com").hostname).toBe("example.com");
  });
});
