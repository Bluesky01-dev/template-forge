import Anthropic from "@anthropic-ai/sdk";
import { applyOps, type EditOp, type SiteDoc } from "@tf/schema";
import { EDIT_TOOLS, EDIT_TOOL_NAMES } from "./tools";
import { editRequest, systemPrompt } from "./prompts";

export const DEFAULT_MODEL = "claude-opus-5-5";

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface RunEditOptions {
  client?: Anthropic;
  apiKey?: string;
  model?: string;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  /** prior turns of this project's chat (plain text only) */
  history?: ChatTurn[];
  /** brand profile / client notes, rendered into the user turn */
  context?: string;
  maxIterations?: number;
}

export interface AppliedOp {
  op: EditOp | Record<string, unknown>;
  ok: boolean;
  error?: string;
}

export interface RunEditResult {
  doc: SiteDoc;
  reply: string;
  applied: AppliedOp[];
  changed: boolean;
  stopReason: string | null;
  usage: { input: number; output: number; cacheRead: number; cacheWrite: number };
  model: string;
}

/**
 * Agent loop: Claude proposes edit-tool calls, each is validated and applied
 * to a working copy of the SiteDoc via applyOps, and errors are returned as
 * tool_result errors so the model can correct itself.
 */
export async function runEdit(doc: SiteDoc, request: string, opts: RunEditOptions = {}): Promise<RunEditResult> {
  const client = opts.client ?? new Anthropic(opts.apiKey ? { apiKey: opts.apiKey } : {});
  const model = opts.model ?? DEFAULT_MODEL;
  const maxIterations = opts.maxIterations ?? 10;

  let working = doc;
  const applied: AppliedOp[] = [];
  const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const replyParts: string[] = [];

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...(opts.history ?? []).map((t) => ({ role: t.role, content: t.text })),
    { role: "user", content: editRequest(JSON.stringify(doc), request, opts.context) },
  ];
  // The API requires the first message to be from the user.
  while (messages[0]?.role === "assistant") messages.shift();

  let stopReason: string | null = null;
  for (let i = 0; i < maxIterations; i++) {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: opts.effort ?? "medium" },
      system: [{ type: "text", text: systemPrompt(), cache_control: { type: "ephemeral" } }],
      tools: EDIT_TOOLS,
      messages,
    });
    usage.input += response.usage.input_tokens;
    usage.output += response.usage.output_tokens;
    usage.cacheRead += response.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += response.usage.cache_creation_input_tokens ?? 0;
    stopReason = response.stop_reason;

    for (const block of response.content) if (block.type === "text" && block.text.trim()) replyParts.push(block.text.trim());

    if (response.stop_reason === "refusal") {
      replyParts.push("I can't make that change.");
      break;
    }
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) break;

    messages.push({ role: "assistant", content: response.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = toolUses.map((tu) => {
      if (!EDIT_TOOL_NAMES.has(tu.name))
        return { type: "tool_result", tool_use_id: tu.id, is_error: true, content: `Unknown tool ${tu.name}` };
      const op = { op: tu.name, ...(tu.input as Record<string, unknown>) };
      const r = applyOps(working, [op]);
      if (r.ok) {
        working = r.doc;
        applied.push({ op, ok: true });
        return { type: "tool_result", tool_use_id: tu.id, content: "applied" };
      }
      applied.push({ op, ok: false, error: r.error });
      return { type: "tool_result", tool_use_id: tu.id, is_error: true, content: `Rejected: ${r.error}` };
    });
    // All results for one assistant turn go back in a single user message.
    messages.push({ role: "user", content: results });
  }

  return {
    doc: working,
    reply: replyParts.join("\n\n") || (applied.some((a) => a.ok) ? "Done." : "No changes were made."),
    applied,
    changed: applied.some((a) => a.ok),
    stopReason,
    usage,
    model,
  };
}

export function isAuthError(e: unknown): boolean {
  return e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError;
}
export function isRateLimit(e: unknown): boolean {
  return e instanceof Anthropic.RateLimitError;
}
