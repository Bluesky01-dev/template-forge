import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env as CloudflareEnv;
}

export async function getDb() {
  const env = await getEnv();
  return drizzle(env.DB, { schema });
}

export async function getSecrets() {
  const env = await getEnv();
  return {
    anthropicKey: env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || undefined,
    appPassword: env.APP_PASSWORD || process.env.APP_PASSWORD || undefined,
    model: env.TF_MODEL || process.env.TF_MODEL || undefined,
  };
}
