import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteRenderer } from "@tf/renderer";
import { getPublished } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublished(slug);
  if (!site) return {};
  return {
    title: { absolute: site.doc.meta.title },
    description: site.doc.meta.description,
    robots: { index: false }, // pitch sites are for the client, not search engines
  };
}

/** Public pitch link: the published snapshot, no app chrome. */
export default async function PublishedSite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getPublished(slug);
  if (!site) notFound();
  return <SiteRenderer doc={site.doc} />;
}
