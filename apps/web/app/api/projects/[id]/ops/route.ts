import { z } from "zod";
import { applyOps } from "@tf/schema";
import { getProject, saveVersion } from "@/lib/data";
import { authed, fail, json } from "@/lib/api";

const Body = z.object({ ops: z.array(z.unknown()).min(1).max(50), summary: z.string().max(300) });

/** Direct (non-AI) edits from the editor UI, e.g. the theme panel. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authed();
  if (denied) return denied;
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid request");
  const project = await getProject(id);
  if (!project) return fail("Project not found", 404);
  const r = applyOps(project.doc, parsed.data.ops);
  if (!r.ok) return fail(r.error, 422);
  const versionId = await saveVersion(id, r.doc, { summary: parsed.data.summary, source: "manual", ops: parsed.data.ops as never });
  return json({ doc: r.doc, versionId });
}
