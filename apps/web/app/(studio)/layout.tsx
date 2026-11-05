import Link from "next/link";
import { ThemeScope } from "@tf/renderer";
import { requireAuth } from "@/lib/auth";
import { getSecrets } from "@/lib/env";
import { appTokens } from "@/lib/app-theme";
import { logoutAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const { appPassword } = await getSecrets();
  return (
    <ThemeScope tokens={appTokens} className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <Link href="/" className="flex items-center gap-2 font-display text-[15px] font-semibold tracking-tight">
            <span aria-hidden className="inline-block size-5 rounded-tf bg-primary" />
            Template Forge
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Pitches</Link>
            <Link href="/templates" className="hover:text-foreground">Templates</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {appPassword && (
              <form action={logoutAction}>
                <button className="text-muted-foreground hover:text-foreground">Sign out</button>
              </form>
            )}
          </div>
        </div>
      </header>
      {children}
    </ThemeScope>
  );
}
