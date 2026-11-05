"use client";

import { Button } from "@tf/ui";
import { timeAgo } from "@/lib/format";
import type { Ver } from "./use-project";

export function HistoryPanel({ versions, busy, onRestore }: { versions: Ver[]; busy: boolean; onRestore: (id: string) => void }) {
  return (
    <ol className="flex flex-col divide-y divide-border overflow-y-auto">
      {versions.map((v, i) => (
        <li key={v.id} className="flex items-start gap-3 p-4 text-sm">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="line-clamp-2">{v.summary}</span>
            <span className="text-xs text-muted-foreground">
              {v.source} · {timeAgo(v.createdAt)}
              {i === 0 && " · current"}
            </span>
          </div>
          {i > 0 && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onRestore(v.id)}>
              Restore
            </Button>
          )}
        </li>
      ))}
    </ol>
  );
}
