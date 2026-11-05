import * as React from "react";
import { cn } from "../lib/cn";

export interface MediaProps {
  src?: string;
  alt?: string;
  className?: string;
  /** aspect ratio utility, e.g. "aspect-video" */
  ratio?: string;
}

/** Image with a token-colored placeholder when no src is provided. */
export function Media({ src, alt = "", className, ratio = "aspect-[4/3]" }: MediaProps) {
  if (!src)
    return (
      <div
        role="img"
        aria-label={alt || "Image placeholder"}
        className={cn(
          ratio,
          "w-full rounded-tf bg-gradient-to-br from-primary/25 via-muted to-accent/25 ring-1 ring-border",
          className,
        )}
      />
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn(ratio, "w-full rounded-tf object-cover", className)} />;
}

export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cn("size-10 rounded-full object-cover", className)} />
  ) : (
    <span
      aria-hidden
      className={cn("inline-flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground", className)}
    >
      {initials}
    </span>
  );
}

const ICONS: Record<string, string> = {
  spark: "M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.3L12 16.5 5.8 21l2.4-7.3L2 9.2h7.6z",
  bolt: "M13 2L3 14h7l-1 8 10-12h-7z",
  shield: "M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  heart: "M12 21s-7-4.4-9.5-9A5.5 5.5 0 0112 6a5.5 5.5 0 019.5 6c-2.5 4.6-9.5 9-9.5 9z",
  globe: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 0c3 3 3 17 0 20m0-20c-3 3-3 17 0 20M2 12h20",
  check: "M5 12l5 5L20 7",
  layers: "M12 2l10 5-10 5L2 7zm-10 10l10 5 10-5M2 17l10 5 10-5",
};
export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name = "spark", className }: { name?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("size-5", className)}
    >
      <path d={ICONS[name] ?? ICONS.spark} />
    </svg>
  );
}
