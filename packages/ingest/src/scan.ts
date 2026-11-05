import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

export interface SourceFile {
  path: string;
  ext: string;
  content: string;
}

const SKIP = new Set(["node_modules", ".next", ".astro", "dist", ".git", ".vercel", ".turbo", "public", "out"]);
const EXTS = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".astro", ".html", ".css", ".scss"]);
const MAX = 2_000_000;

/** Collect the source files of a Next.js / Astro / static export. */
export async function scanProject(root: string): Promise<SourceFile[]> {
  const out: SourceFile[] = [];
  async function walk(dir: string) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      if (e.name.startsWith(".") && e.name !== ".") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP.has(e.name)) await walk(p);
      } else if (EXTS.has(extname(e.name)) && !/\.(test|spec|stories|config|d)\.\w+$/.test(e.name)) {
        if ((await stat(p)).size > MAX) continue;
        out.push({ path: relative(root, p), ext: extname(e.name), content: await readFile(p, "utf8") });
      }
    }
  }
  await walk(root);
  // Pages/entry files first, so the outline follows page order.
  // Header/nav components go before the page and footer components after it,
  // mirroring how they render (they're usually separate files in exports).
  const has = (f: SourceFile, tag: string) => new RegExp(`<${tag}[\\s>]`, "i").test(f.content);
  const rank = (f: SourceFile) => {
    const h1 = has(f, "h1");
    if (!h1 && (has(f, "nav") || has(f, "header"))) return 0;
    if (!h1 && has(f, "footer")) return 9;
    return /(^|\/)(page|index)\.(tsx|jsx|astro|html)$/.test(f.path) ? 1 : /(pages|app)\//.test(f.path) ? 2 : 3;
  };
  return out.sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path));
}
