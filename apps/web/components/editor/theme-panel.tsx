"use client";

import { useState } from "react";
import { Radius, type SiteDoc } from "@tf/schema";
import { checkContrast, generateTokens, toHex } from "@tf/tokens";
import { isGoogleFont } from "@tf/brand/fonts";
import { Button } from "@tf/ui";

export function ThemePanel({ doc, busy, onApply }: { doc: SiteDoc; busy: boolean; onApply: (ops: unknown[], summary: string) => void }) {
  const t = doc.tokens;
  const [primary, setPrimary] = useState(toHex(t.colors.primary));
  const [secondary, setSecondary] = useState(toHex(t.colors.secondary));
  const [accent, setAccent] = useState(toHex(t.colors.accent));
  const [mode, setMode] = useState(t.mode);
  const [radius, setRadius] = useState(t.radius);
  const [display, setDisplay] = useState(t.fonts.display.family);
  const [body, setBody] = useState(t.fonts.body.family);

  const preview = generateTokens({
    primary,
    secondary,
    accent,
    mode,
    radius,
    fonts: {
      display: { ...t.fonts.display, family: display, google: isGoogleFont(display) || t.fonts.display.google && display === t.fonts.display.family },
      body: { ...t.fonts.body, family: body, google: isGoogleFont(body) || t.fonts.body.google && body === t.fonts.body.family },
    },
  });
  const contrast = checkContrast(preview);

  const apply = () =>
    onApply(
      [{ op: "set_tokens", mode: preview.mode, colors: preview.colors, radius: preview.radius, fonts: preview.fonts }],
      `Theme: ${primary} · ${mode} · ${display}/${body}`,
    );

  const color = (label: string, value: string, set: (v: string) => void) => (
    <label className="flex items-center justify-between gap-3 text-sm">
      {label}
      <span className="flex items-center gap-2">
        <code className="text-xs text-muted-foreground">{value}</code>
        <input type="color" value={value} onChange={(e) => set(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
      </span>
    </label>
  );

  return (
    <div className="flex flex-col gap-5 overflow-y-auto p-4">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold">Brand colors</legend>
        {color("Primary", primary, setPrimary)}
        {color("Secondary", secondary, setSecondary)}
        {color("Accent", accent, setAccent)}
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold">Style</legend>
        <label className="flex items-center justify-between text-sm">
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value as "light" | "dark")} className="h-9 rounded-tf border border-border bg-background px-2">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="flex items-center justify-between text-sm">
          Corner radius
          <select value={radius} onChange={(e) => setRadius(e.target.value as typeof radius)} className="h-9 rounded-tf border border-border bg-background px-2">
            {Radius.options.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
      </fieldset>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-semibold">Fonts</legend>
        {(
          [
            ["Headings", display, setDisplay],
            ["Body", body, setBody],
          ] as const
        ).map(([label, v, set]) => (
          <label key={label} className="flex flex-col gap-1 text-sm">
            {label}
            <input value={v} onChange={(e) => set(e.target.value)} className="h-9 rounded-tf border border-border bg-background px-2" />
            {!isGoogleFont(v) && <span className="text-xs text-muted-foreground">Not in the Google Fonts list — it will use the visitor&apos;s installed font or a fallback.</span>}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-1 text-xs">
        <span className="font-semibold">Contrast check</span>
        {contrast.map((c) => (
          <span key={c.fg} className={c.pass ? "text-muted-foreground" : "text-[oklch(0.55_0.2_25)]"}>
            {c.pass ? "✓" : "✗"} {c.fg} on {c.bg}: {c.ratio}:1
          </span>
        ))}
      </div>
      <Button onClick={apply} disabled={busy}>Apply theme</Button>
    </div>
  );
}
