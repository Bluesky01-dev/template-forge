import { Badge, Button, Card, Container, Heading, Text } from "@tf/ui";
import { templates } from "@tf/templates";
import { ScaledFrame } from "@/components/scaled-frame";
import { blankProjectAction } from "@/app/actions";

export const metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <Container className="flex flex-col gap-8 py-12">
      <div className="flex flex-col gap-2">
        <Heading as="h1" size="h2">Template library</Heading>
        <Text tone="muted">
          Every template is built from the same atoms, molecules and sections, so any brand can be applied to any template.
          Add more with <code>pnpm ingest</code>.
        </Text>
      </div>
      <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {templates.map(({ manifest: m }) => (
          <li key={m.id}>
            <Card className="flex h-full flex-col gap-4 p-4">
              <ScaledFrame src={`/preview/template/${m.id}`} title={`${m.name} preview`} scale={0.28} height={260} />
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-semibold">{m.name}</span>
                <Badge variant="outline">{m.mood.mode}</Badge>
              </div>
              <Text size="sm" tone="muted">{m.description}</Text>
              <div className="flex flex-wrap gap-1.5">
                {m.industries.slice(0, 6).map((i) => (
                  <Badge key={i}>{i}</Badge>
                ))}
              </div>
              <form action={blankProjectAction} className="mt-auto flex gap-2">
                <input type="hidden" name="templateId" value={m.id} />
                <input
                  name="name"
                  placeholder="Project name"
                  className="h-9 min-w-0 flex-1 rounded-tf border border-border bg-background px-3 text-sm"
                />
                <Button size="sm" type="submit">Use template</Button>
              </form>
            </Card>
          </li>
        ))}
      </ul>
    </Container>
  );
}
