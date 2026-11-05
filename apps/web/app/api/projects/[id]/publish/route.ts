import { z } from "zod";
import { slugify } from "@tf/engine";
import { getProject, publishProject, slugTaken, unpublishProject } from "@/lib/data";
import { authed, fail, json } from "@/lib/api";

/** Publish the current doc as a snapshot at /p/:slug (re-publish to update it). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authed();
  if (denied) return denied;
  const { id } = await params;
  const parsed = z.object({ slug: z.string().max(60).optional() }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid request");
  const project = await getProject(id);
  if (!project) return fail("Project not found", 404);
  const explicit = parsed.data.slug || project.publishedSlug;
  const base = slugify(explicit || project.name);
  let slug = base;
  if (explicit) {
    if (await slugTaken(slug, id)) return fail(`The link /p/${slug} is already used by another pitch.`, 409);
  } else {
    // Auto-named links get a numeric suffix instead of failing (e.g. two pitches for one client).
    for (let n = 2; (await slugTaken(slug, id)) && n < 100; n++) slug = `${base}-${n}`;
  }
  await publishProject(id, slug, project.doc);
  return json({ slug, url: `/p/${slug}` });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authed();
  if (denied) return denied;
  const { id } = await params;
  await unpublishProject(id);
  return json({ ok: true });
}
