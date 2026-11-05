import { notFound, redirect } from "next/navigation";
import { SiteRenderer } from "@tf/renderer";
import { getTemplate } from "@tf/templates";
import { buildSite } from "@tf/engine";
import { isAuthed } from "@/lib/auth";
import { getAnalysis } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

/** Library template preview; with ?a=<analysisId> it is themed + personalized for that client. */
export default async function TemplatePreview({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ a?: string }>;
}) {
  if (!(await isAuthed())) redirect("/login");
  const { templateId } = await params;
  const { a } = await searchParams;
  const tpl = getTemplate(templateId);
  if (!tpl) notFound();
  let doc = tpl.doc;
  if (a) {
    const analysis = await getAnalysis(a);
    if (analysis) doc = buildSite(tpl, analysis.profile, analysis.input);
  }
  return <SiteRenderer doc={doc} />;
}
