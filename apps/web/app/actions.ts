"use server";

import { redirect } from "next/navigation";
import { analyzeSite, fetchSite } from "@tf/brand";
import { buildSite, rankTemplates, slugify } from "@tf/engine";
import { getTemplate, templates } from "@tf/templates";
import { BrandProfile } from "@tf/schema";
import { isAuthed, login, logout } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { createAnalysis, createProject, deleteProject, getAnalysis } from "@/lib/data";

export interface FormState {
  error?: string;
}

async function guard() {
  if (!(await isAuthed())) redirect("/login");
}

function normalizeUrl(raw: string) {
  const s = raw.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return /^(localhost|127\.)/.test(s) ? `http://${s}` : `https://${s}`;
}

export async function analyzeAction(_prev: FormState, form: FormData): Promise<FormState> {
  await guard();
  const raw = String(form.get("url") ?? "");
  const notes = String(form.get("notes") ?? "").trim() || null;
  if (!raw.trim()) return { error: "Enter the client's website URL." };
  let id: string;
  try {
    const url = normalizeUrl(raw);
    const env = await getEnv();
    const allowPrivate =
      process.env.NODE_ENV === "development" && (env.TF_ALLOW_PRIVATE_FETCH ?? process.env.TF_ALLOW_PRIVATE_FETCH) === "1";
    const snap = await fetchSite(url, { allowPrivate });
    const analysis = analyzeSite(snap);
    const ranked = rankTemplates(analysis.profile, analysis.input, templates);
    id = await createAnalysis({ url: snap.url, profile: analysis.profile, input: analysis.input, palette: analysis.palette, ranked, notes });
  } catch (e) {
    return { error: `Couldn't analyze that site: ${(e as Error).message}` };
  }
  redirect(`/analyses/${id}`);
}

export async function buildAction(form: FormData) {
  await guard();
  const analysisId = String(form.get("analysisId"));
  const templateId = String(form.get("templateId"));
  const analysis = await getAnalysis(analysisId);
  const tpl = getTemplate(templateId);
  if (!analysis || !tpl) throw new Error("Analysis or template not found");
  const doc = buildSite(tpl, analysis.profile, analysis.input);
  const id = await createProject({ name: doc.name, clientUrl: analysis.url, templateId, analysisId, doc });
  redirect(`/projects/${id}?welcome=1`);
}

export async function blankProjectAction(form: FormData) {
  await guard();
  const templateId = String(form.get("templateId"));
  const name = String(form.get("name") ?? "").trim() || "Untitled pitch";
  const tpl = getTemplate(templateId);
  if (!tpl) throw new Error("Template not found");
  const profile = BrandProfile.parse({ url: "https://example.com/", name });
  const doc = buildSite(tpl, profile, { primary: tpl.manifest.defaultTokens.colors.primary }, { id: `${slugify(name)}-${templateId}` });
  doc.tokens = tpl.doc.tokens; // keep the template's own look
  const id = await createProject({ name, templateId, doc });
  redirect(`/projects/${id}`);
}

export async function deleteProjectAction(form: FormData) {
  await guard();
  await deleteProject(String(form.get("projectId")));
  redirect("/");
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const ok = await login(String(form.get("password") ?? ""));
  if (!ok) return { error: "Wrong password." };
  redirect("/");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
