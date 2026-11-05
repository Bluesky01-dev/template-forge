import { z } from "zod";
import { COLOR_TOKENS, CssColor, FontSpec, Radius } from "./tokens";
import { Section, Tone } from "./sections";
import { SiteDoc } from "./site";

/**
 * Edit operations: the ONLY way the chat agent changes a site.
 * Each op is validated, applied to a copy, and the result is re-validated,
 * so a bad edit can never corrupt a SiteDoc.
 */
const target = { pageId: z.string(), sectionId: z.string() };

export const EditOp = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("set_tokens"),
    mode: z.enum(["light", "dark"]).optional(),
    colors: z.partialRecord(z.enum(COLOR_TOKENS), CssColor).optional(),
    radius: Radius.optional(),
    fonts: z.object({ display: FontSpec.partial().optional(), body: FontSpec.partial().optional() }).optional(),
  }),
  z.object({ op: z.literal("set_meta"), title: z.string().optional(), description: z.string().optional() }),
  z.object({ op: z.literal("add_section"), pageId: z.string(), index: z.number().int().min(0).optional(), section: z.unknown() }),
  z.object({ op: z.literal("remove_section"), ...target }),
  z.object({ op: z.literal("move_section"), ...target, toIndex: z.number().int().min(0) }),
  z.object({ op: z.literal("set_variant"), ...target, variant: z.string() }),
  z.object({ op: z.literal("set_tone"), ...target, tone: Tone }),
  z.object({
    op: z.literal("update_props"),
    ...target,
    /** deep-merged into existing props; arrays are replaced wholesale */
    props: z.record(z.string(), z.unknown()),
  }),
]);
export type EditOp = z.infer<typeof EditOp>;

export type ApplyResult =
  | { ok: true; doc: SiteDoc }
  | { ok: false; opIndex: number; error: string };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function deepMerge(base: unknown, patch: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = v === null ? undefined : deepMerge(base[k], v);
  }
  return out;
}

function applyOne(doc: SiteDoc, op: EditOp): SiteDoc | string {
  const page = "pageId" in op ? doc.pages.find((p) => p.id === op.pageId) : undefined;
  if ("pageId" in op && !page) return `page "${op.pageId}" not found`;
  const idx = page && "sectionId" in op ? page.sections.findIndex((s) => s.id === op.sectionId) : -1;
  if ("sectionId" in op && idx < 0) return `section "${op.sectionId}" not found on page "${op.pageId}"`;

  const replaceSection = (raw: unknown): string | null => {
    const parsed = Section.safeParse(raw);
    if (!parsed.success) return z.prettifyError(parsed.error);
    page!.sections[idx] = parsed.data;
    return null;
  };

  switch (op.op) {
    case "set_tokens": {
      const t = doc.tokens;
      if (op.mode) t.mode = op.mode;
      if (op.radius) t.radius = op.radius;
      if (op.colors) Object.assign(t.colors, op.colors);
      if (op.fonts?.display) t.fonts.display = { ...t.fonts.display, ...op.fonts.display };
      if (op.fonts?.body) t.fonts.body = { ...t.fonts.body, ...op.fonts.body };
      return doc;
    }
    case "set_meta":
      Object.assign(doc.meta, Object.fromEntries(Object.entries(op).filter(([k, v]) => k !== "op" && v !== undefined)));
      return doc;
    case "add_section": {
      const parsed = Section.safeParse(op.section);
      if (!parsed.success) return z.prettifyError(parsed.error);
      if (page!.sections.some((s) => s.id === parsed.data.id)) return `section id "${parsed.data.id}" already exists`;
      page!.sections.splice(op.index ?? page!.sections.length, 0, parsed.data);
      return doc;
    }
    case "remove_section":
      page!.sections.splice(idx, 1);
      return doc;
    case "move_section": {
      const [s] = page!.sections.splice(idx, 1);
      page!.sections.splice(Math.min(op.toIndex, page!.sections.length), 0, s!);
      return doc;
    }
    case "set_variant":
      return replaceSection({ ...page!.sections[idx], variant: op.variant }) ?? doc;
    case "set_tone":
      return replaceSection({ ...page!.sections[idx], tone: op.tone }) ?? doc;
    case "update_props": {
      const s = page!.sections[idx]!;
      return replaceSection({ ...s, props: deepMerge(s.props, op.props) }) ?? doc;
    }
  }
}

/** Apply ops atomically: either all succeed and the result validates, or nothing changes. */
export function applyOps(doc: SiteDoc, ops: unknown[]): ApplyResult {
  let next: SiteDoc = structuredClone(doc);
  for (let i = 0; i < ops.length; i++) {
    const parsedOp = EditOp.safeParse(ops[i]);
    if (!parsedOp.success) return { ok: false, opIndex: i, error: z.prettifyError(parsedOp.error) };
    const r = applyOne(next, parsedOp.data);
    if (typeof r === "string") return { ok: false, opIndex: i, error: r };
    next = r;
  }
  const final = SiteDoc.safeParse(next);
  if (!final.success) return { ok: false, opIndex: ops.length - 1, error: z.prettifyError(final.error) };
  return { ok: true, doc: final.data };
}
