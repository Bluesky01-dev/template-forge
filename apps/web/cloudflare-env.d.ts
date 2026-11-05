// Bindings and vars from wrangler.jsonc (regenerate with `pnpm cf-typegen`).
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  TF_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  APP_PASSWORD?: string;
  /** dev only */
  TF_ALLOW_PRIVATE_FETCH?: string;
}
