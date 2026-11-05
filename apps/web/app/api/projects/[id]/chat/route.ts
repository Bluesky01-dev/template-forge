import { z } from "zod";
import { PERSONALIZE_REQUEST, isAuthError, isRateLimit, runEdit } from "@tf/agent";
import { addMessage, getAnalysis, getProject, listMessages, saveVersion } from "@/lib/data";
import { getSecrets } from "@/lib/env";
import { authed, fail, json } from "@/lib/api";

const Body = z.object({
  message: z.string().max(4000).default(""),
  personalize: z.boolean().default(false),
  selectedSectionId: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authed();
  if (denied) return denied;
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid request");
  const { message, personalize, selectedSectionId } = parsed.data;
  if (!personalize && !message.trim()) return fail("Message is empty");

  const project = await getProject(id);
  if (!project) return fail("Project not found", 404);
  const { anthropicKey, model } = await getSecrets();
  if (!anthropicKey) return fail("The AI editor is off: set the ANTHROPIC_API_KEY secret in Cloudflare (or .dev.vars locally).", 503);

  const analysis = project.analysisId ? await getAnalysis(project.analysisId) : null;
  const context = analysis
    ? JSON.stringify({
        client: analysis.profile.name,
        url: analysis.url,
        industry: analysis.profile.industry,
        tone: analysis.profile.tone,
        headline: analysis.profile.content.headline,
        summary: analysis.profile.content.summary,
        services: analysis.profile.content.services,
        notes: analysis.notes,
      })
    : project.clientUrl
      ? JSON.stringify({ client: project.name, url: project.clientUrl })
      : undefined;

  const history = (await listMessages(id)).slice(-20).map((m) => ({ role: m.role, text: m.content }));
  const userText = personalize ? "✨ Personalize the copy for this client" : message.trim();
  const request = personalize
    ? PERSONALIZE_REQUEST
    : selectedSectionId
      ? `(The user selected the section with id "${selectedSectionId}" in the preview — "this"/"here" refers to it.)\n${message.trim()}`
      : message.trim();

  await addMessage(id, { role: "user", content: userText });
  try {
    const result = await runEdit(project.doc, request, { apiKey: anthropicKey, model, history, context });
    const versionId = result.changed
      ? await saveVersion(id, result.doc, { summary: result.reply, source: "chat", ops: result.applied.filter((a) => a.ok).map((a) => a.op) })
      : undefined;
    await addMessage(id, {
      role: "assistant",
      content: result.reply,
      versionId,
      meta: { usage: result.usage, model: result.model, applied: result.applied },
    });
    return json({ reply: result.reply, doc: result.doc, versionId, changed: result.changed, applied: result.applied, usage: result.usage });
  } catch (e) {
    const msg = isAuthError(e)
      ? "Anthropic rejected the API key — check the ANTHROPIC_API_KEY secret."
      : isRateLimit(e)
        ? "Rate limited by the Anthropic API — try again in a moment."
        : `AI request failed: ${(e as Error).message}`;
    await addMessage(id, { role: "assistant", content: `⚠️ ${msg}` });
    return fail(msg, 502);
  }
}
