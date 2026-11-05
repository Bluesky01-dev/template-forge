import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { BrandProfile, SiteDoc, type EditOp } from "@tf/schema";
import type { BrandInput } from "@tf/tokens";
import type { RankedTemplate } from "@tf/engine";
import { getDb } from "./env";
import { analyses, messages, projects, versions } from "./schema";

const now = () => Date.now();

/* ---------------- analyses ---------------- */
export interface Analysis {
  id: string;
  url: string;
  profile: BrandProfile;
  input: BrandInput;
  palette: Array<{ hex: string; weight: number; neutral: boolean }>;
  ranked: RankedTemplate[];
  notes: string | null;
  createdAt: number;
}

export async function createAnalysis(a: Omit<Analysis, "id" | "createdAt">): Promise<string> {
  const db = await getDb();
  const id = nanoid(12);
  await db.insert(analyses).values({
    id,
    url: a.url,
    profile: JSON.stringify(a.profile),
    brandInput: JSON.stringify(a.input),
    palette: JSON.stringify(a.palette),
    ranked: JSON.stringify(a.ranked),
    notes: a.notes,
    createdAt: now(),
  });
  return id;
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
  const db = await getDb();
  const row = await db.query.analyses.findFirst({ where: eq(analyses.id, id) });
  if (!row) return null;
  return {
    id: row.id,
    url: row.url,
    profile: BrandProfile.parse(JSON.parse(row.profile)),
    input: JSON.parse(row.brandInput),
    palette: JSON.parse(row.palette),
    ranked: JSON.parse(row.ranked),
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

/* ---------------- projects ---------------- */
export interface ProjectSummary {
  id: string;
  name: string;
  clientUrl: string | null;
  templateId: string;
  publishedSlug: string | null;
  updatedAt: number;
}

export interface Project extends ProjectSummary {
  analysisId: string | null;
  doc: SiteDoc;
  publishedAt: number | null;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const db = await getDb();
  return db
    .select({
      id: projects.id,
      name: projects.name,
      clientUrl: projects.clientUrl,
      templateId: projects.templateId,
      publishedSlug: projects.publishedSlug,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .orderBy(desc(projects.updatedAt))
    .limit(100);
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDb();
  const row = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    clientUrl: row.clientUrl,
    templateId: row.templateId,
    analysisId: row.analysisId,
    publishedSlug: row.publishedSlug,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    doc: SiteDoc.parse(JSON.parse(row.doc)),
  };
}

export async function createProject(p: {
  name: string;
  clientUrl?: string;
  templateId: string;
  analysisId?: string;
  doc: SiteDoc;
}): Promise<string> {
  const db = await getDb();
  const id = nanoid(12);
  const t = now();
  await db.insert(projects).values({
    id,
    name: p.name,
    clientUrl: p.clientUrl ?? null,
    templateId: p.templateId,
    analysisId: p.analysisId ?? null,
    doc: JSON.stringify(p.doc),
    createdAt: t,
    updatedAt: t,
  });
  await db.insert(versions).values({
    id: nanoid(12),
    projectId: id,
    doc: JSON.stringify(p.doc),
    ops: null,
    summary: `Built from template "${p.templateId}"`,
    source: "build",
    createdAt: t,
  });
  return id;
}

/** Save a new current doc + a version row (the history / undo stack). */
export async function saveVersion(
  projectId: string,
  doc: SiteDoc,
  v: { summary: string; source: "chat" | "manual" | "restore"; ops?: Array<EditOp | Record<string, unknown>> },
): Promise<string> {
  const db = await getDb();
  const id = nanoid(12);
  const t = now();
  const json = JSON.stringify(doc);
  await db.batch([
    db.update(projects).set({ doc: json, updatedAt: t, name: doc.name }).where(eq(projects.id, projectId)),
    db.insert(versions).values({
      id,
      projectId,
      doc: json,
      ops: v.ops ? JSON.stringify(v.ops) : null,
      summary: v.summary.slice(0, 300),
      source: v.source,
      createdAt: t,
    }),
  ]);
  return id;
}

export async function listVersions(projectId: string) {
  const db = await getDb();
  return db
    .select({ id: versions.id, summary: versions.summary, source: versions.source, createdAt: versions.createdAt })
    .from(versions)
    .where(eq(versions.projectId, projectId))
    .orderBy(desc(versions.createdAt))
    .limit(50);
}

export async function getVersionDoc(projectId: string, versionId: string): Promise<SiteDoc | null> {
  const db = await getDb();
  const row = await db.query.versions.findFirst({ where: and(eq(versions.id, versionId), eq(versions.projectId, projectId)) });
  return row ? SiteDoc.parse(JSON.parse(row.doc)) : null;
}

export async function deleteProject(id: string) {
  const db = await getDb();
  await db.batch([
    db.delete(messages).where(eq(messages.projectId, id)),
    db.delete(versions).where(eq(versions.projectId, id)),
    db.delete(projects).where(eq(projects.id, id)),
  ]);
}

/* ---------------- chat messages ---------------- */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  versionId: string | null;
  createdAt: number;
}

export async function listMessages(projectId: string): Promise<ChatMessage[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.projectId, projectId))
    .orderBy(messages.createdAt)
    .limit(200);
  return rows.map((r) => ({ id: r.id, role: r.role as "user" | "assistant", content: r.content, versionId: r.versionId, createdAt: r.createdAt }));
}

export async function addMessage(projectId: string, m: { role: "user" | "assistant"; content: string; versionId?: string; meta?: unknown }) {
  const db = await getDb();
  const id = nanoid(12);
  await db.insert(messages).values({
    id,
    projectId,
    role: m.role,
    content: m.content,
    versionId: m.versionId ?? null,
    meta: m.meta ? JSON.stringify(m.meta) : null,
    createdAt: now(),
  });
  return id;
}

/* ---------------- publishing ---------------- */
export async function publishProject(id: string, slug: string, doc: SiteDoc) {
  const db = await getDb();
  await db
    .update(projects)
    .set({ publishedSlug: slug, publishedDoc: JSON.stringify(doc), publishedAt: now() })
    .where(eq(projects.id, id));
}

export async function unpublishProject(id: string) {
  const db = await getDb();
  await db.update(projects).set({ publishedSlug: null, publishedDoc: null, publishedAt: null }).where(eq(projects.id, id));
}

export async function slugTaken(slug: string, exceptProjectId: string) {
  const db = await getDb();
  const row = await db.query.projects.findFirst({ where: eq(projects.publishedSlug, slug) });
  return !!row && row.id !== exceptProjectId;
}

export async function getPublished(slug: string): Promise<{ doc: SiteDoc; name: string } | null> {
  const db = await getDb();
  const row = await db.query.projects.findFirst({ where: eq(projects.publishedSlug, slug) });
  if (!row?.publishedDoc) return null;
  return { doc: SiteDoc.parse(JSON.parse(row.publishedDoc)), name: row.name };
}
