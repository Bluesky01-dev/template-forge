import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

export const headingVariants = cva("font-display tracking-tight text-balance text-foreground", {
  variants: {
    size: {
      display: "text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl",
      h2: "text-3xl font-semibold leading-tight sm:text-4xl",
      h3: "text-xl font-semibold leading-snug",
      h4: "text-base font-semibold",
    },
  },
  defaultVariants: { size: "h2" },
});

type HeadingTag = "h1" | "h2" | "h3" | "h4";
export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof headingVariants> {
  as?: HeadingTag;
}

export function Heading({ as = "h2", size, className, ...props }: HeadingProps) {
  const Tag = as;
  return <Tag className={cn(headingVariants({ size }), className)} {...props} />;
}

export const textVariants = cva("font-body text-pretty", {
  variants: {
    size: { lg: "text-lg leading-relaxed", md: "text-base leading-relaxed", sm: "text-sm leading-normal" },
    tone: { default: "text-foreground", muted: "text-muted-foreground" },
  },
  defaultVariants: { size: "md", tone: "default" },
});

export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof textVariants> {}

export function Text({ size, tone, className, ...props }: TextProps) {
  return <p className={cn(textVariants({ size, tone }), className)} {...props} />;
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("font-body text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground", className)}
      {...props}
    />
  );
}
