import { z } from "zod";
import { getProject, getVersionDoc, saveVersion } from "@/lib/data";
import { authed, fail, json } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authed();
  if (denied) return denied;
  const { id } = await params;
  const parsed = z.object({ versionId: z.string() }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid request");
  if (!(await getProject(id))) return fail("Project not found", 404);
  const doc = await getVersionDoc(id, parsed.data.versionId);
  if (!doc) return fail("Version not found", 404);
  const versionId = await saveVersion(id, doc, { summary: "Restored an earlier version", source: "restore" });
  return json({ doc, versionId });
}
