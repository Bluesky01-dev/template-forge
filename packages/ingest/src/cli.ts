#!/usr/bin/env -S npx tsx
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { ingest } from "./ingest";
import { writeTemplate } from "./write";

const HELP = `tf-ingest — turn a Next.js / Astro / HTML export of a (Framer) template into a library template

Usage:
  pnpm ingest <export-dir> --id <template-id> [options]

Options:
  --id <id>            Template id (lowercase-kebab), required
  --name <name>        Display name (default: from id)
  --ai                 Map sections with Claude (needs ANTHROPIC_API_KEY)
  --model <model>      Claude model (default: claude-opus-5-5)
  --industries a,b     Override detected industries
  --source-url <url>   Where the template came from (e.g. Framer marketplace URL)
  --license <text>     License note (e.g. "Framer marketplace, client use allowed")
  --dry-run            Print the result instead of writing it
  -h, --help           Show this help
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    id: { type: "string" },
    name: { type: "string" },
    ai: { type: "boolean", default: false },
    model: { type: "string" },
    industries: { type: "string" },
    "source-url": { type: "string" },
    license: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

async function main() {
  if (values.help || positionals.length !== 1 || !values.id) {
    console.log(HELP);
    process.exit(values.help ? 0 : 1);
  }
  if (!/^[a-z0-9-]+$/.test(values.id)) throw new Error("--id must be lowercase-kebab-case");
  if (values.ai && !process.env.ANTHROPIC_API_KEY) throw new Error("--ai needs ANTHROPIC_API_KEY in the environment");

  const dir = resolve(process.env.INIT_CWD ?? process.cwd(), positionals[0]!);
  const { manifest, doc, report } = await ingest({
    dir,
    id: values.id,
    name: values.name,
    useAi: values.ai,
    model: values.model,
    sourceUrl: values["source-url"],
    license: values.license,
    industries: values.industries?.split(",").map((s) => s.trim()).filter(Boolean),
    log: (m) => console.log(`• ${m}`),
  });

  console.log(`\nSections: ${report.sections.join(" → ")}`);
  console.log(`Industries: ${manifest.industries.join(", ")} · mood: ${manifest.mood.mode}/${manifest.mood.styles.join("+")}`);
  const failing = report.contrast.filter((c) => !c.pass);
  console.log(failing.length ? `Contrast issues: ${failing.map((c) => `${c.fg}/${c.bg} ${c.ratio}`).join(", ")}` : "Contrast: all pairs pass WCAG AA");

  if (values["dry-run"]) {
    console.log(JSON.stringify({ manifest, site: doc }, null, 2));
    return;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const out = await writeTemplate(resolve(here, "../../templates/src/ingested"), manifest, doc);
  console.log(`\n✓ Wrote ${out}\n  Review it in Storybook (Templates) and the app's /templates page, then commit.`);
}

main().catch((e) => {
  console.error(`✗ ${(e as Error).message}`);
  process.exit(1);
});
