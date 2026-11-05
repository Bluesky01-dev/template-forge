import { notFound } from "next/navigation";
import { Badge, Button, Card, Container, Heading, Text, cn } from "@tf/ui";
import { WEIGHTS, type Criterion } from "@tf/engine";
import { getAnalysis } from "@/lib/data";
import { host } from "@/lib/format";
import { ScaledFrame } from "@/components/scaled-frame";
import { buildAction } from "@/app/actions";

export const metadata = { title: "Template recommendations" };

const LABEL: Record<Criterion, string> = {
  industry: "Industry fit",
  coverage: "Sections they need",
  mood: "Look & feel",
  content: "Content volume",
  contrast: "Brand-color contrast",
};

function Swatch({ hex, label }: { hex: string; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-7 rounded-tf border border-border" style={{ background: hex }} />
      <span className="flex flex-col leading-tight">
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        <code className="text-xs">{hex}</code>
      </span>
    </div>
  );
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getAnalysis(id);
  if (!a) notFound();
  const p = a.profile;
  const top = a.ranked.slice(0, 3);
  const rest = a.ranked.slice(3);

  return (
    <Container className="flex flex-col gap-10 py-10">
      <div className="flex flex-col gap-2">
        <Text size="sm" tone="muted">Analysis of {host(a.url)}</Text>
        <Heading as="h1" size="h2">{p.name ?? host(a.url)}</Heading>
        {p.content.headline && <Text tone="muted">“{p.content.headline}”</Text>}
      </div>

      <Card className="grid gap-6 md:grid-cols-4">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold">Brand colors</span>
          <Swatch hex={a.input.primary} label="Primary" />
          {a.input.secondary && <Swatch hex={a.input.secondary} label="Secondary" />}
          {a.input.accent && <Swatch hex={a.input.accent} label="Accent" />}
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold">Palette found</span>
          <div className="flex flex-wrap gap-1.5">
            {a.palette.map((c) => (
              <span key={c.hex} title={`${c.hex} · ${Math.round(c.weight * 100)}%`} className="size-6 rounded-full border border-border" style={{ background: c.hex }} />
            ))}
          </div>
          <Text size="sm" tone="muted">Their site is {p.mode ?? "light"}.</Text>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold">Typography</span>
          <span>Display: {p.fonts.display ?? "—"}</span>
          <span>Body: {p.fonts.body ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-semibold">Business</span>
          <span>Industry: {p.industry ?? "unclear"}</span>
          <div className="flex flex-wrap gap-1.5">
            {p.content.needs.map((n) => (
              <Badge key={n}>{n}</Badge>
            ))}
          </div>
        </div>
      </Card>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <Heading size="h3">Recommended templates</Heading>
          <Text size="sm" tone="muted">
            Previews are already in their colors and fonts. Scores weigh{" "}
            {(Object.keys(WEIGHTS) as Criterion[]).map((k) => `${LABEL[k].toLowerCase()} ${Math.round(WEIGHTS[k] * 100)}%`).join(", ")}.
          </Text>
        </div>
        <ol className="grid gap-6 lg:grid-cols-3">
          {top.map((r, i) => (
            <li key={r.templateId}>
              <Card className={cn("flex h-full flex-col gap-4 p-4", i === 0 && "border-primary ring-2 ring-primary")}>
                <ScaledFrame src={`/preview/template/${r.templateId}?a=${a.id}`} title={`${r.name} themed for ${p.name}`} scale={0.3} height={280} />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-display text-lg font-semibold">
                    {r.name}
                    {i === 0 && <Badge variant="primary">Best match</Badge>}
                  </span>
                  <span className="font-display text-3xl font-semibold tabular-nums">{r.score}</span>
                </div>
                <dl className="flex flex-col gap-1.5">
                  {(Object.keys(WEIGHTS) as Criterion[]).map((k) => (
                    <div key={k} className="grid grid-cols-[1fr_90px] items-center gap-3 text-xs">
                      <dt className="text-muted-foreground">{LABEL[k]}</dt>
                      <dd className="h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`${Math.round(r.breakdown[k] * 100)}%`}>
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${r.breakdown[k] * 100}%` }} />
                      </dd>
                    </div>
                  ))}
                </dl>
                <ul className="flex flex-col gap-1 text-sm">
                  {r.reasons.map((x) => (
                    <li key={x}>✓ {x}</li>
                  ))}
                  {r.warnings.map((x) => (
                    <li key={x} className="text-muted-foreground">! {x}</li>
                  ))}
                </ul>
                <form action={buildAction} className="mt-auto">
                  <input type="hidden" name="analysisId" value={a.id} />
                  <input type="hidden" name="templateId" value={r.templateId} />
                  <Button type="submit" className="w-full" variant={i === 0 ? "primary" : "outline"}>
                    Build with {r.name}
                  </Button>
                </form>
              </Card>
            </li>
          ))}
        </ol>
        {rest.length > 0 && (
          <Text size="sm" tone="muted">
            Also considered: {rest.map((r) => `${r.name} (${r.score})`).join(", ")}
          </Text>
        )}
      </section>
    </Container>
  );
}
