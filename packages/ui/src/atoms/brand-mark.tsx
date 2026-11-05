"use client";

import { useState } from "react";
import { cn } from "../lib/cn";

/** Logo image that falls back to the brand name if it is missing or fails to load. */
export function BrandMark({ name, logo, className }: { name: string; logo?: { src: string; alt?: string }; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!logo?.src || failed) return <span className={cn("font-display text-lg font-semibold tracking-tight", className)}>{name}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo.src} alt={logo.alt || name} onError={() => setFailed(true)} className={cn("h-7 w-auto max-w-[180px] object-contain", className)} />
  );
}
