import type { Meta, StoryObj } from "@storybook/react-vite";
import { COLOR_TOKENS } from "@tf/schema";
import { Container, Heading, Text } from "@tf/ui";

function Tokens() {
  return (
    <Container className="flex flex-col gap-10 py-10">
      <div className="flex flex-col gap-2">
        <Heading>Design tokens</Heading>
        <Text tone="muted">Every component uses only these semantic tokens. Switch the theme in the toolbar to re-skin everything.</Text>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        {COLOR_TOKENS.map((t) => (
          <div key={t} className="flex flex-col gap-2">
            <div className="h-16 rounded-tf border border-border" style={{ background: `var(--tf-${t})` }} />
            <code className="text-xs">{t}</code>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Heading size="display">Display heading</Heading>
        <Heading>Section heading</Heading>
        <Heading size="h3">Card heading</Heading>
        <Text size="lg">Large body text for intros and subtitles.</Text>
        <Text tone="muted">Muted body text for supporting copy.</Text>
      </div>
      <div className="flex gap-4">
        {["bg-primary text-primary-foreground", "bg-secondary text-secondary-foreground", "bg-accent text-accent-foreground", "bg-surface text-surface-foreground border border-border"].map((c) => (
          <div key={c} className={`flex h-24 w-40 items-center justify-center rounded-tf text-sm font-medium ${c}`}>
            Aa {c.split(" ")[0]!.replace("bg-", "")}
          </div>
        ))}
      </div>
    </Container>
  );
}

const meta: Meta<typeof Tokens> = { title: "Foundations/Tokens", component: Tokens };
export default meta;
export const All: StoryObj<typeof Tokens> = {};
