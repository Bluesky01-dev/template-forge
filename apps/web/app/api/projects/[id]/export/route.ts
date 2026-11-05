import { getProject } from "@/lib/data";
import { authed, fail } from "@/lib/api";

/** Download the SiteDoc JSON (portable: re-importable, versionable, renderable anywhere). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authed();
  if (denied) return denied;
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return fail("Project not found", 404);
  return new Response(JSON.stringify(project.doc, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="${project.doc.id}.sitedoc.json"`,
    },
  });
}
