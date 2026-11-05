import type Anthropic from "@anthropic-ai/sdk";
import { COLOR_TOKENS, Radius, SECTION_VARIANTS, Section, STYLE_TAGS, Tone } from "@tf/schema";
import { z } from "zod";

const target = {
  pageId: { type: "string", description: 'Page id, usually "home".' },
  sectionId: { type: "string", description: "Id of the section to change." },
} as const;

/**
 * One tool per EditOp. Tool name == op name, so a tool call maps 1:1 onto the
 * validated op engine in @tf/schema (applyOps).
 */
export const EDIT_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "set_tokens",
    description:
      "Change the design tokens (theme). Colors are CSS colors (hex or oklch). Only pass what should change. Foreground/background pairs must stay readable; prefer changing primary/secondary/accent and let the matching *-foreground follow.",
    input_schema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["light", "dark"] },
        colors: {
          type: "object",
          description: `Partial map of semantic color tokens: ${COLOR_TOKENS.join(", ")}`,
          properties: Object.fromEntries(COLOR_TOKENS.map((k) => [k, { type: "string" }])),
          additionalProperties: false,
        },
        radius: { type: "string", enum: Radius.options },
        fonts: {
          type: "object",
          properties: {
            display: { type: "object", properties: { family: { type: "string" }, google: { type: "boolean" } } },
            body: { type: "object", properties: { family: { type: "string" }, google: { type: "boolean" } } },
          },
        },
      },
    },
  },
  {
    name: "set_meta",
    description: "Change the page <title> or meta description.",
    input_schema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } },
  },
  {
    name: "add_section",
    description:
      "Insert a new section. `section` must match the section schema in the system prompt (id, type, variant, tone, props). Ids must be unique on the page.",
    input_schema: {
      type: "object",
      properties: {
        pageId: target.pageId,
        index: { type: "integer", minimum: 0, description: "Position (0 = top). Omit to append before nothing (end)." },
        section: { type: "object", description: "Full section object." },
      },
      required: ["pageId", "section"],
    },
  },
  {
    name: "remove_section",
    description: "Delete a section.",
    input_schema: { type: "object", properties: target, required: ["pageId", "sectionId"] },
  },
  {
    name: "move_section",
    description: "Move a section to a new index (0 = top).",
    input_schema: {
      type: "object",
      properties: { ...target, toIndex: { type: "integer", minimum: 0 } },
      required: ["pageId", "sectionId", "toIndex"],
    },
  },
  {
    name: "set_variant",
    description: `Switch a section's layout variant. Variants per type: ${JSON.stringify(SECTION_VARIANTS)}`,
    input_schema: {
      type: "object",
      properties: { ...target, variant: { type: "string" } },
      required: ["pageId", "sectionId", "variant"],
    },
  },
  {
    name: "set_tone",
    description:
      "Set a section band's color tone: default (page background), surface (subtle contrast band), primary (brand-colored band), inverted (dark-on-light flip).",
    input_schema: {
      type: "object",
      properties: { ...target, tone: { type: "string", enum: Tone.options } },
      required: ["pageId", "sectionId", "tone"],
    },
  },
  {
    name: "update_props",
    description:
      "Edit a section's content. `props` is deep-merged into the existing props; arrays (items, links, plans…) are replaced wholesale, so send the full array. Set a key to null to remove it.",
    input_schema: {
      type: "object",
      properties: { ...target, props: { type: "object" } },
      required: ["pageId", "sectionId", "props"],
    },
  },
];

export const EDIT_TOOL_NAMES = new Set(EDIT_TOOLS.map((t) => t.name));

/** Compact JSON Schema of every section type, for the (cached) system prompt. */
export function sectionSchemaReference(): string {
  const schema = z.toJSONSchema(Section, { target: "draft-2020-12", unrepresentable: "any", io: "input" });
  return JSON.stringify(schema);
}

export const STYLE_VOCAB = STYLE_TAGS;
