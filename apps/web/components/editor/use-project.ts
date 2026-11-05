"use client";

import { useCallback, useState } from "react";
import type { SiteDoc } from "@tf/schema";

export interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  versionId: string | null;
  createdAt: number;
  pending?: boolean;
}
export interface Ver {
  id: string;
  summary: string;
  source: string;
  createdAt: number;
}

async function post<T>(url: string, body: unknown, method = "POST"): Promise<T> {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

/** Client-side state + server calls for one project in the editor. */
export function useProject(projectId: string, init: { doc: SiteDoc; messages: Msg[]; versions: Ver[]; slug: string | null }) {
  const [doc, setDoc] = useState(init.doc);
  const [messages, setMessages] = useState<Msg[]>(init.messages);
  const [versions, setVersions] = useState<Ver[]>(init.versions);
  const [slug, setSlug] = useState(init.slug);
  const [busy, setBusy] = useState<null | "chat" | "save" | "publish">(null);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0); // bump to reload the preview iframe

  const pushVersion = (id: string | undefined, summary: string, source: string) => {
    if (id) setVersions((v) => [{ id, summary, source, createdAt: Date.now() }, ...v]);
  };

  const chat = useCallback(
    async (message: string, opts: { personalize?: boolean; selectedSectionId?: string } = {}) => {
      setBusy("chat");
      setError(null);
      const temp: Msg = {
        id: `tmp-${Date.now()}`,
        role: "user",
        content: opts.personalize ? "✨ Personalize the copy for this client" : message,
        versionId: null,
        createdAt: Date.now(),
      };
      setMessages((m) => [...m, temp, { id: "pending", role: "assistant", content: "", versionId: null, createdAt: Date.now(), pending: true }]);
      try {
        const r = await post<{ reply: string; doc: SiteDoc; versionId?: string; changed: boolean }>(`/api/projects/${projectId}/chat`, {
          message,
          ...opts,
        });
        setMessages((m) => [...m.filter((x) => x.id !== "pending"), { id: `a-${Date.now()}`, role: "assistant", content: r.reply, versionId: r.versionId ?? null, createdAt: Date.now() }]);
        if (r.changed) {
          setDoc(r.doc);
          pushVersion(r.versionId, r.reply, "chat");
          setRev((x) => x + 1);
        }
      } catch (e) {
        const msg = (e as Error).message;
        setMessages((m) => [...m.filter((x) => x.id !== "pending"), { id: `e-${Date.now()}`, role: "assistant", content: `⚠️ ${msg}`, versionId: null, createdAt: Date.now() }]);
        setError(msg);
      } finally {
        setBusy(null);
      }
    },
    [projectId],
  );

  const applyOps = useCallback(
    async (ops: unknown[], summary: string) => {
      setBusy("save");
      setError(null);
      try {
        const r = await post<{ doc: SiteDoc; versionId: string }>(`/api/projects/${projectId}/ops`, { ops, summary });
        setDoc(r.doc);
        pushVersion(r.versionId, summary, "manual");
        setRev((x) => x + 1);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [projectId],
  );

  const restore = useCallback(
    async (versionId: string) => {
      setBusy("save");
      setError(null);
      try {
        const r = await post<{ doc: SiteDoc; versionId: string }>(`/api/projects/${projectId}/restore`, { versionId });
        setDoc(r.doc);
        pushVersion(r.versionId, "Restored an earlier version", "restore");
        setRev((x) => x + 1);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [projectId],
  );

  const publish = useCallback(
    async (wanted?: string) => {
      setBusy("publish");
      setError(null);
      try {
        const r = await post<{ slug: string }>(`/api/projects/${projectId}/publish`, { slug: wanted });
        setSlug(r.slug);
        return r.slug;
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(null);
      }
    },
    [projectId],
  );

  const unpublish = useCallback(async () => {
    setBusy("publish");
    try {
      await post(`/api/projects/${projectId}/publish`, {}, "DELETE");
      setSlug(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }, [projectId]);

  return { doc, messages, versions, slug, busy, error, setError, rev, chat, applyOps, restore, publish, unpublish };
}
