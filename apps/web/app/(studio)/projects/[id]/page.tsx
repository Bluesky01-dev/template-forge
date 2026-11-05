import { notFound } from "next/navigation";
import { getProject, listMessages, listVersions } from "@/lib/data";
import { getSecrets } from "@/lib/env";
import { Editor } from "@/components/editor/editor";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProject(id);
  return { title: p ? `Edit ${p.name}` : "Not found" };
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { id } = await params;
  const { welcome } = await searchParams;
  const project = await getProject(id);
  if (!project) notFound();
  const [messages, versions, secrets] = await Promise.all([listMessages(id), listVersions(id), getSecrets()]);
  return (
    <Editor
      project={{ id: project.id, name: project.name, clientUrl: project.clientUrl, publishedSlug: project.publishedSlug, hasAnalysis: !!project.analysisId }}
      initialDoc={project.doc}
      initialMessages={messages}
      initialVersions={versions}
      aiEnabled={!!secrets.anthropicKey}
      welcome={welcome === "1"}
    />
  );
}
