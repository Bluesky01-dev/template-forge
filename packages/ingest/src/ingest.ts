import { SiteDoc, type SectionInput } from "@tf/schema";
import { checkContrast, generateTokens, type BrandInput } from "@tf/tokens";
import { isGoogleFont } from "@tf/brand/fonts";
import { scanProject } from "./scan";
import { extractOutline, extractTokens, outlineToText } from "./extract";
import { assignTones, inferManifest, mapOutline } from "./map";
import { aiMap } from "./ai";

export interface IngestOptions {
  dir: string;
  id: string;
  name?: string;
  useAi?: boolean;
  apiKey?: string;
  model?: string;
  sourceUrl?: string;
  license?: string;
  industries?: string[];
  log?: (msg: string) => void;
}

export async function ingest(opts: IngestOptions) {
  const log = opts.log ?? (() => {});
  const name = opts.name ?? opts.id.replace(/(^|-)(\w)/g, (_, s, c) => `${s ? " " : ""}${c.toUpperCase()}`);

  const files = await scanProject(opts.dir);
  if (files.length === 0) throw new Error(`No source files found in ${opts.dir}`);
  log(`Scanned ${files.length} files`);

  const { input, palette } = extractTokens(files);
  const fontSpec = (f?: { family?: string }) => (f?.family ? { family: f.family, google: isGoogleFont(f.family) } : undefined);
  const brand: BrandInput = { ...input, fonts: { display: fontSpec(input.fonts?.display), body: fontSpec(input.fonts?.body) } };
  const tokens = generateTokens(brand);
  log(`Tokens: primary ${brand.primary}, mode ${brand.mode}, fonts ${brand.fonts?.display?.family ?? "-"} / ${brand.fonts?.body?.family ?? "-"}`);

  const nodes = extractOutline(files);
  log(`Outline: ${nodes.length} content nodes`);
  let sections: SectionInput[] = assignTones(mapOutline(nodes, name));
  let description: string | undefined;
  let industries = opts.industries;

  if (opts.useAi) {
    log("Mapping sections with Claude…");
    const ai = await aiMap({ name, outline: outlineToText(nodes), draft: sections, apiKey: opts.apiKey, model: opts.model });
    sections = ai.sections;
    description = ai.description;
    industries = industries?.length ? industries : ai.industries;
  }

  const doc = SiteDoc.parse({
    version: 1,
    id: opts.id,
    name,
    templateId: opts.id,
    meta: { title: name, description: description ?? "" },
    tokens,
    pages: [{ id: "home", slug: "/", title: "Home", sections }],
  });
  const manifest = inferManifest({ id: opts.id, name, description, tokens, doc, nodes, sourceUrl: opts.sourceUrl, license: opts.license, industries });
  return {
    manifest,
    doc,
    report: {
      files: files.length,
      nodes: nodes.length,
      palette,
      sections: doc.pages[0]!.sections.map((s) => `${s.type}/${s.variant}`),
      contrast: checkContrast(tokens),
    },
  };
}
