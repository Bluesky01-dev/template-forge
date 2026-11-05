import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { sectionSchemaReference } from "@tf/agent";
import { Section, STYLE_TAGS, type SectionInput } from "@tf/schema";

export interface AiMapping {
  description: string;
  industries: string[];
  styles: Array<(typeof STYLE_TAGS)[number]>;
  sections: SectionInput[];
}

const Emit = z.object({
  description: z.string().min(10).max(300),
  industries: z.array(z.string()).min(1).max(10),
  styles: z.array(z.enum(STYLE_TAGS)).min(1).max(4),
  sections: z.array(Section).min(2),
});

const TOOL: Anthropic.Beta.BetaTool = {
  name: "emit_template",
  description: "Return the template mapped onto the section taxonomy. Call exactly once with the complete result.",
  input_schema: {
    type: "object",
    properties: {
      description: { type: "string", description: "One sentence describing the template's look and best use." },
      industries: { type: "array", items: { type: "string" }, description: "Lowercase industries it suits (e.g. saas, agency, restaurant, trades, health, real-estate)." },
      styles: { type: "array", items: { type: "string", enum: [...STYLE_TAGS] } },
      sections: { type: "array", items: { type: "object" }, description: "Ordered sections; each must validate against the section schema." },
    },
    required: ["description", "industries", "styles", "sections"],
  },
};

/**
 * Ask Claude to map an extracted outline onto the section taxonomy.
 * The heuristic draft is provided as a starting point; output is validated
 * with Zod and validation errors are fed back for up to `maxAttempts`.
 */
export async function aiMap(opts: {
  name: string;
  outline: string;
  draft: SectionInput[];
  apiKey?: string;
  model?: string;
  maxAttempts?: number;
}): Promise<AiMapping> {
  const client = new Anthropic(opts.apiKey ? { apiKey: opts.apiKey } : {});
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    {
      role: "user",
      content: `Template name: ${opts.name}

<outline>
${opts.outline}
</outline>

<heuristic_draft>
${JSON.stringify(opts.draft)}
</heuristic_draft>

Map this website template onto the section taxonomy and call emit_template once.
- Keep the template's original copy (it is placeholder copy that will be replaced per client), its order and its structure.
- Choose the section type and variant that best reproduce each block; use tones (surface/primary/inverted) to mirror alternating bands.
- Use unique, short kebab-case section ids. Image src should be "" (placeholders).
- Fix anything the heuristic draft got wrong; drop decorative fragments.`,
    },
  ];
  const max = opts.maxAttempts ?? 3;
  for (let attempt = 0; attempt < max; attempt++) {
    const res = await client.beta.messages.create({
      model: opts.model ?? "claude-opus-5-5",
      max_tokens: 32000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high" },
      system: [
        {
          type: "text",
          text: `You convert website templates into a typed section schema for a component library built with atomic design.\n\nSection schema (JSON Schema):\n${sectionSchemaReference()}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [TOOL],
      messages,
    });
    if (res.stop_reason === "refusal") throw new Error("The model declined this request.");
    const call = res.content.find((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === "emit_template");
    if (!call) {
      messages.push({ role: "assistant", content: res.content });
      messages.push({ role: "user", content: "Please call emit_template with the result." });
      continue;
    }
    const parsed = Emit.safeParse(call.input);
    if (parsed.success) return parsed.data as AiMapping;
    messages.push({ role: "assistant", content: res.content });
    messages.push({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: call.id, is_error: true, content: `Validation failed, fix and call again:\n${z.prettifyError(parsed.error)}` }],
    });
  }
  throw new Error(`AI mapping failed validation after ${max} attempts`);
}
