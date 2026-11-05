import { notFound, redirect } from "next/navigation";
import { SiteRenderer } from "@tf/renderer";
import { isAuthed } from "@/lib/auth";
import { getProject } from "@/lib/data";
import { SectionPicker } from "@/components/section-picker";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function ProjectPreview({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  return (
    <>
      <SiteRenderer doc={project.doc} />
      <SectionPicker />
    </>
  );
}
