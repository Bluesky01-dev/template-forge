import { describe, expect, it } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { SiteDoc } from "@tf/schema";
import { runEdit } from "./agent";
import { EDIT_TOOLS, sectionSchemaReference } from "./tools";

const doc = SiteDoc.parse({
  version: 1,
  id: "t",
  name: "T",
  templateId: "t",
  meta: { title: "T" },
  tokens: {
    mode: "light",
    colors: Object.fromEntries(
      ["background","foreground","surface","surface-foreground","primary","primary-foreground","secondary","secondary-foreground","accent","accent-foreground","muted","muted-foreground","border","ring"].map((k) => [k, "#888888"]),
    ),
    fonts: { display: { family: "Inter" }, body: { family: "Inter" } },
  },
  pages: [{ id: "home", slug: "/", title: "Home", sections: [{ id: "hero", type: "hero", props: { title: "Old" } }] }],
});

/** Scripted fake client: returns queued responses and records requests. */
function fakeClient(responses: Array<Partial<Anthropic.Beta.BetaMessage>>) {
  const requests: unknown[] = [];
  const client = {
    beta: {
      messages: {
        create: async (req: unknown) => {
          requests.push(structuredClone(req));
          const r = responses.shift()!;
          return { usage: { input_tokens: 10, output_tokens: 5 }, stop_reason: "end_turn", content: [], ...r };
        },
      },
    },
  } as unknown as Anthropic;
  return { client, requests };
}

describe("runEdit", () => {
  it("applies tool calls, feeds back validation errors, and lets the model recover", async () => {
    const { client, requests } = fakeClient([
      {
        stop_reason: "tool_use",
        content: [
          { type: "tool_use", id: "a", name: "update_props", input: { pageId: "home", sectionId: "hero", props: { title: "New title" } } } as never,
          { type: "tool_use", id: "b", name: "set_variant", input: { pageId: "home", sectionId: "hero", variant: "diagonal" } } as never,
        ],
      },
      {
        stop_reason: "tool_use",
        content: [{ type: "tool_use", id: "c", name: "set_variant", input: { pageId: "home", sectionId: "hero", variant: "split" } } as never],
      },
      { stop_reason: "end_turn", content: [{ type: "text", text: "Updated the hero." } as never] },
    ]);

    const r = await runEdit(doc, "make the hero split with a new title", { client });
    const hero = r.doc.pages[0]!.sections[0]!;
    expect(hero.variant).toBe("split");
    expect((hero.props as { title: string }).title).toBe("New title");
    expect(r.applied.map((a) => a.ok)).toEqual([true, false, true]);
    expect(r.reply).toBe("Updated the hero.");
    expect(r.usage.output).toBe(15);
    // original doc untouched
    expect(doc.pages[0]!.sections[0]!.variant).toBe("centered");

    // second request carries both tool results in ONE user message, error flagged
    const second = requests[1] as { messages: Array<{ role: string; content: unknown }> };
    const last = second.messages.at(-1)!;
    expect(last.role).toBe("user");
    expect((last.content as Array<{ is_error?: boolean }>).map((c) => !!c.is_error)).toEqual([false, true]);
  });

  it("drops leading assistant history and sends model + fallbacks", async () => {
    const { client, requests } = fakeClient([{ stop_reason: "end_turn", content: [] }]);
    const r = await runEdit(doc, "hi", { client, history: [{ role: "assistant", text: "Welcome" }] });
    const req = requests[0] as { model: string; fallbacks: string; messages: Array<{ role: string }> };
    expect(req.model).toBe("claude-opus-5-5");
    expect(req.fallbacks).toBe("default");
    expect(req.messages[0]!.role).toBe("user");
    expect(r.changed).toBe(false);
  });

  it("builds tool + schema reference", () => {
    expect(EDIT_TOOLS.map((t) => t.name)).toContain("update_props");
    expect(sectionSchemaReference()).toContain("logo-cloud");
  });
});
