import Link from "next/link";
import { Badge, Card, Container, Heading, Text } from "@tf/ui";
import { templates } from "@tf/templates";
import { listProjects } from "@/lib/data";
import { getSecrets } from "@/lib/env";
import { host, timeAgo } from "@/lib/format";
import { NewPitchForm } from "@/components/new-pitch-form";

export default async function Dashboard() {
  const [projects, secrets] = await Promise.all([listProjects(), getSecrets()]);
  return (
    <Container className="flex flex-col gap-12 py-12">
      <section className="flex max-w-3xl flex-col gap-5">
        <Heading as="h1" size="h2">Pitch a client</Heading>
        <Text tone="muted">
          Paste a prospect&apos;s website. Template Forge reads their colors, fonts and content, ranks your templates for them,
          and builds an on-brand site you can refine by chatting.
        </Text>
        <NewPitchForm />
        {!secrets.anthropicKey && (
          <Text size="sm" tone="muted">
            <Badge variant="outline" className="mr-2">AI off</Badge>
            Set the <code>ANTHROPIC_API_KEY</code> secret to enable the chat editor. Analysis, ranking and theming work without it.
          </Text>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <Heading size="h3">Your pitches</Heading>
          <Link href="/templates" className="text-sm text-muted-foreground hover:text-foreground">
            Or start from a template ({templates.length}) →
          </Link>
        </div>
        {projects.length === 0 ? (
          <Card className="text-sm text-muted-foreground">No pitches yet. Analyze a client site above to create one.</Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="block h-full">
                  <Card className="flex h-full flex-col gap-2 transition-colors hover:border-primary">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold">{p.name}</span>
                      {p.publishedSlug && <Badge variant="primary">Live</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {host(p.clientUrl) || "No client URL"} · {p.templateId}
                    </span>
                    <span className="mt-auto text-xs text-muted-foreground">Updated {timeAgo(p.updatedAt)}</span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
