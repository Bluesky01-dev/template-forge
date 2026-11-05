"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteDoc } from "@tf/schema";
import { Button, cn } from "@tf/ui";
import { ChatPanel } from "./chat-panel";
import { ThemePanel } from "./theme-panel";
import { HistoryPanel } from "./history-panel";
import { useProject, type Msg, type Ver } from "./use-project";

const DEVICES = { desktop: "100%", tablet: "820px", mobile: "390px" } as const;
type Tab = "chat" | "theme" | "history";

export function Editor({
  project,
  initialDoc,
  initialMessages,
  initialVersions,
  aiEnabled,
  welcome,
}: {
  project: { id: string; name: string; clientUrl: string | null; publishedSlug: string | null; hasAnalysis: boolean };
  initialDoc: SiteDoc;
  initialMessages: Msg[];
  initialVersions: Ver[];
  aiEnabled: boolean;
  welcome: boolean;
}) {
  const p = useProject(project.id, { doc: initialDoc, messages: initialMessages, versions: initialVersions, slug: project.publishedSlug });
  const [tab, setTab] = useState<Tab>("chat");
  const [device, setDevice] = useState<keyof typeof DEVICES>("desktop");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  // Section picking: messages from the preview iframe.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "tf:select") {
        setSelected(e.data.sectionId);
        setTab("chat");
      }
      if (e.data?.type === "tf:ready") frame.current?.contentWindow?.postMessage({ type: "tf:select-mode", on: selectMode }, window.location.origin);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [selectMode]);

  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ type: "tf:select-mode", on: selectMode }, window.location.origin);
  }, [selectMode]);

  const pitchUrl = p.slug ? `${typeof window === "undefined" ? "" : window.location.origin}/p/${p.slug}` : null;

  return (
    <div className="grid h-[calc(100dvh-3.5rem)] grid-cols-1 lg:grid-cols-[400px_1fr]">
      {/* ---------- left: panels ---------- */}
      <aside className="flex min-h-0 flex-col border-r border-border bg-background max-lg:h-[55dvh] max-lg:border-b">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate font-display font-semibold">{p.doc.name}</h1>
            <p className="truncate text-xs text-muted-foreground">{project.clientUrl ?? p.doc.templateId}</p>
          </div>
        </div>
        <div role="tablist" className="flex border-b border-border text-sm">
          {(["chat", "theme", "history"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("flex-1 py-2.5 capitalize", tab === t ? "border-b-2 border-primary font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {t}
              {t === "history" && <span className="ml-1 text-xs text-muted-foreground">({p.versions.length})</span>}
            </button>
          ))}
        </div>
        {welcome && p.messages.length === 0 && tab === "chat" && (
          <div className="mx-4 mt-4 rounded-tf border border-border bg-surface p-3 text-sm">
            First draft built from the template with the client&apos;s brand. {aiEnabled ? "Personalize the copy, then iterate by chatting." : ""}
          </div>
        )}
        {tab === "chat" && (
          <ChatPanel
            messages={p.messages}
            busy={p.busy === "chat"}
            aiEnabled={aiEnabled}
            canPersonalize={project.hasAnalysis}
            selected={selected}
            onClearSelected={() => {
              setSelected(null);
              frame.current?.contentWindow?.postMessage({ type: "tf:clear-selection" }, window.location.origin);
            }}
            onSend={(text) => p.chat(text, { selectedSectionId: selected ?? undefined })}
            onPersonalize={() => p.chat("", { personalize: true })}
          />
        )}
        {tab === "theme" && <ThemePanel key={p.rev} doc={p.doc} busy={!!p.busy} onApply={p.applyOps} />}
        {tab === "history" && <HistoryPanel versions={p.versions} busy={!!p.busy} onRestore={p.restore} />}
      </aside>

      {/* ---------- right: preview ---------- */}
      <section className="flex min-h-0 flex-col bg-muted">
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-3 py-2">
          <div className="flex rounded-tf border border-border p-0.5 text-xs">
            {(Object.keys(DEVICES) as Array<keyof typeof DEVICES>).map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                aria-pressed={device === d}
                className={cn("rounded-tf px-2.5 py-1 capitalize", device === d ? "bg-muted font-medium" : "text-muted-foreground")}
              >
                {d}
              </button>
            ))}
          </div>
          <Button size="sm" variant={selectMode ? "primary" : "outline"} onClick={() => setSelectMode((s) => !s)} aria-pressed={selectMode}>
            {selectMode ? "Selecting…" : "Select"}
          </Button>
          {p.busy && <span className="text-xs text-muted-foreground">{p.busy === "chat" ? "AI is editing…" : p.busy === "publish" ? "Publishing…" : "Saving…"}</span>}
          {p.error && (
            <button className="max-w-[40ch] truncate text-xs text-[oklch(0.55_0.2_25)]" onClick={() => p.setError(null)} title={p.error}>
              {p.error} ✕
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <a href={`/api/projects/${project.id}/export`} className="text-xs text-muted-foreground hover:text-foreground">
              Export JSON
            </a>
            <a href={`/preview/${project.id}`} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground">
              Open preview ↗
            </a>
            {p.slug && pitchUrl ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(pitchUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  {copied ? "Copied!" : "Copy pitch link"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => p.unpublish()} disabled={!!p.busy}>Unpublish</Button>
                <Button size="sm" onClick={() => p.publish()} disabled={!!p.busy}>Update live</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => p.publish()} disabled={!!p.busy}>Publish pitch</Button>
            )}
          </div>
        </div>
        {p.slug && (
          <div className="border-b border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
            Live at{" "}
            <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" className="font-medium text-foreground underline">
              /p/{p.slug}
            </a>{" "}
            — republish after editing to update it.
          </div>
        )}
        <div className="flex min-h-0 flex-1 justify-center overflow-auto p-3">
          <iframe
            ref={frame}
            key={p.rev}
            src={`/preview/${project.id}?r=${p.rev}`}
            title="Site preview"
            className="h-full rounded-tf border border-border bg-background shadow-sm transition-[width]"
            style={{ width: DEVICES[device] }}
          />
        </div>
      </section>
    </div>
  );
}
