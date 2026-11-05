import * as React from "react";
import { cn } from "../lib/cn";

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

export interface SectionShellProps extends React.HTMLAttributes<HTMLElement> {
  /** CSS variables from @tf/tokens toneVars(), applied to this band only */
  vars?: Record<string, string>;
  spacing?: "none" | "sm" | "md" | "lg";
}

const SPACING = { none: "", sm: "py-10 sm:py-12", md: "py-16 sm:py-24", lg: "py-20 sm:py-32" } as const;

/** Outermost wrapper of every section: owns tone (via vars), background and vertical rhythm. */
export function SectionShell({ vars, spacing = "md", className, style, ...props }: SectionShellProps) {
  return (
    <section
      className={cn("bg-background font-body text-foreground", SPACING[spacing], className)}
      style={{ ...(vars as React.CSSProperties), ...style }}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-tf border border-border bg-surface p-6 text-surface-foreground", className)} {...props} />;
}
