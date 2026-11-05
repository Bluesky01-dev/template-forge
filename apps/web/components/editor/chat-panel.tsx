"use client";

import { useEffect, useRef, useState } from "react";
import { Button, cn } from "@tf/ui";
import type { Msg } from "./use-project";

const SUGGESTIONS = [
  "Make the hero more bold and punchy",
  "Add a pricing section with three plans",
  "Use a darker, more premium look",
  "Rewrite the FAQ for their customers",
  "Move testimonials above features",
];

export function ChatPanel({
  messages,
  busy,
  aiEnabled,
  canPersonalize,
  selected,
  onClearSelected,
  onSend,
  onPersonalize,
}: {
  messages: Msg[];
  busy: boolean;
  aiEnabled: boolean;
  canPersonalize: boolean;
  selected: string | null;
  onClearSelected: () => void;
  onSend: (text: string) => void;
  onPersonalize: () => void;
}) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = () => {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setText("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Tell the editor what to change — content, layout, colors, sections. Each change is saved as a version you can undo.</p>
            <p>Tip: turn on <strong>Select</strong> above the preview (or Alt-click) to point at a section, then say “make this…”.</p>
            {canPersonalize && aiEnabled && (
              <Button size="sm" variant="secondary" onClick={onPersonalize} disabled={busy} className="self-start">
                ✨ Personalize copy for this client
              </Button>
            )}
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[92%] whitespace-pre-wrap rounded-tf px-3 py-2 text-sm",
              m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted text-foreground",
            )}
          >
            {m.pending ? <span className="animate-pulse">Editing the site…</span> : m.content}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border p-3">
        {!aiEnabled && (
          <p className="text-xs text-muted-foreground">
            AI chat is off. Add the <code>ANTHROPIC_API_KEY</code> secret to enable it. The Theme tab still works.
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              disabled={!aiEnabled || busy}
              onClick={() => onSend(s)}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        {selected && (
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">Selected: {selected}</span>
            <button type="button" onClick={onClearSelected} className="text-muted-foreground hover:text-foreground">clear</button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <textarea
            id="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            disabled={!aiEnabled}
            placeholder={selected ? `Change “${selected}”…` : "e.g. make the hero headline about same-day repairs"}
            className="min-h-11 flex-1 resize-none rounded-tf border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
          />
          <Button type="submit" size="md" disabled={!aiEnabled || busy || !text.trim()}>
            {busy ? "…" : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
