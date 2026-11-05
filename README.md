# Template Forge

Turn your template library into on-brand pitch sites for prospective clients.

1. **Paste a client's URL.** Template Forge reads their colors, fonts, logo and content.
2. **Get ranked templates.** Every template in your library is scored for that client. Each score comes with reasons, and each card shows a live preview already in the client's colors.
3. **Build and iterate by chat.** The chosen template becomes a site you refine in plain English ("make the hero bolder", "add pricing"), or through the theme panel. Every change is versioned and can be undone.
4. **Send a pitch link.** Publish to `/p/<client-name>` and share it.

Templates are built with **atomic design** (atoms → molecules → organisms/sections → templates). Every component is in **Storybook**, and any template can take any brand.

---

## How it works

```
apps/
  web/          Next.js 16 app on Cloudflare Workers (OpenNext) + D1
  storybook/    Storybook 10: the component catalog, with a theme switcher
packages/
  schema/       Zod: TokenSet, Section taxonomy, SiteDoc, TemplateManifest, BrandProfile, EditOps
  tokens/       brand colors → full OKLCH theme with guaranteed WCAG AA contrast
  ui/           atoms + molecules (shadcn-style, cva, Tailwind v4, semantic tokens only)
  sections/     organisms: navbar, hero, logo-cloud, features, stats, testimonials, pricing, faq, cta, footer
  renderer/     SiteDoc → React (scoped themes, per-section tone bands)
  templates/    the template library (handmade + ingested JSON)
  brand/        URL → BrandProfile (colors, fonts, logo, industry, needs)
  engine/       template ranking + site builder
  agent/        Claude chat editor (tool use over validated EditOps)
  ingest/       CLI: Next.js/Astro/HTML export (e.g. from Framer) → library template
```

### Design principles

- **The AI never edits code.** A site is a JSON `SiteDoc`. The chat agent can only call edit tools (`update_props`, `set_variant`, `add_section`, `set_tokens`…). Each call is checked against the Zod schema before it's applied, and invalid edits are sent back to the model to fix. A site can never end up broken, and every change can be undone.
- **One token contract.** Every component uses ~14 semantic color tokens plus radius and fonts, and nothing else. Re-theming means swapping token values, so any brand fits any template.
- **Contrast is guaranteed.** The token engine adjusts text colors (and, for mid-tone brand colors, the fill itself) until each text pair passes WCAG AA. A test covers this across dark, light and mid-tone brands.
- **Section tones.** `default / surface / primary / inverted` bands remap tokens per section using computed values, so text stays readable on every band.

### Ranking

| Criterion | Weight | What it measures |
|---|---|---|
| Industry fit | 30% | Client industry vs the template's `industries` (with related-industry groups) |
| Section coverage | 25% | Needs found on the client's site (pricing, reviews, booking, portfolio…) vs the template's sections |
| Look & feel | 20% | Light/dark match + tone (friendly, premium, bold…) vs template styles |
| Content volume | 15% | Amount of client content vs the template's capacity |
| Brand-color contrast | 10% | Can the brand color be told apart from the template background? (3:1) |

Weights live in `packages/engine/src/rank.ts`.

---

## Local development

Requires Node 22 and pnpm 10.

```bash
pnpm install
```

```bash
cd apps/web && cp .dev.vars.example .dev.vars   # add ANTHROPIC_API_KEY to enable chat
```

```bash
pnpm --filter @tf/web db:migrate:local
```

```bash
pnpm dev                 # app on http://localhost:3000
```

```bash
pnpm storybook           # component catalog on http://localhost:6006
```

```bash
pnpm test && pnpm typecheck
```

To test the analyzer against a site on your machine, put `TF_ALLOW_PRIVATE_FETCH=1` in `.dev.vars`. It only takes effect in `next dev`.

## Deploy to Cloudflare

You only do this once.

1. **Create the database:**
   ```bash
   cd apps/web && npx wrangler d1 create template-forge
   ```
   Paste the printed `database_id` into `apps/web/wrangler.jsonc`, then commit.
2. **Create the tables:**
   ```bash
   npx wrangler d1 migrations apply DB --remote
   ```
3. **Add secrets:**
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   ```
   ```bash
   npx wrangler secret put APP_PASSWORD
   ```
   `APP_PASSWORD` protects the dashboard and editor. Pitch links stay public.
4. **Connect GitHub (Workers Builds):** Cloudflare dashboard → Workers & Pages → Create → *Import a repository* → pick this repo.
   - Root directory: `apps/web`
   - Build command: `pnpm run cf:build`
   - Deploy command: `npx opennextjs-cloudflare deploy`

   After that, every push to `main` deploys to production, and other branches get preview URLs.

Or deploy from your machine: `pnpm --filter @tf/web deploy`.

Optional: host Storybook as a second Workers/Pages project with build command `pnpm build-storybook` and output directory `apps/storybook/storybook-static`.

When the schema changes, add a new file in `apps/web/migrations/` and run `npx wrangler d1 migrations apply DB --remote`.

## Adding templates

### From a Framer / Next.js / Astro export

```bash
pnpm ingest ./path/to/export --id my-template --name "My Template" --source-url https://framer.com/... --license "Framer marketplace"
```

```bash
ANTHROPIC_API_KEY=... pnpm ingest ./path/to/export --id my-template --ai   # Claude maps the sections
```

The CLI:
1. Scans `.tsx/.jsx/.astro/.html/.css`.
2. Extracts tokens from CSS, JS style objects, Framer `--token-*` variables, `GF;Font-600` font ids and Tailwind arbitrary values.
3. Builds a content outline.
4. Maps it onto the section types, heuristically or with Claude (`--ai`). The result is checked against the schema, and errors go back to the model.
5. Writes `packages/templates/src/ingested/<id>.json`.

Then review it in Storybook and on `/templates`, and commit. Make sure your template license allows client work.

### By hand

Copy `packages/templates/src/aurora.ts`, change the content and tokens, and register it in `packages/templates/src/index.ts`.

## Adding a section type or variant

1. Add or extend its Zod schema in `packages/schema/src/sections.ts`.
2. Build the component in `packages/sections`. Use only `@tf/ui` atoms/molecules and semantic token classes.
3. Register it in `packages/sections/src/registry.ts`. TypeScript fails the build if any section type has no component.
4. Add a story in `apps/storybook/stories/organisms`.

The chat agent picks up the new schema automatically, through the JSON Schema in its system prompt.

## AI model

The chat editor and `--ai` ingestion use `claude-opus-5-5` (override with the `TF_MODEL` variable or `--model`). Chat runs at medium effort, with server-side refusal fallbacks enabled.

## Known limitations

- Brand extraction reads static HTML and CSS. Sites that build everything client-side may yield fewer colors. You can still set colors in the Theme tab. Cloudflare Browser Rendering is the planned upgrade.
- Ingestion maps templates onto the existing section types. A truly new layout needs a new section variant (see above).
- Pitch links are snapshots. Republish after editing to update them.
