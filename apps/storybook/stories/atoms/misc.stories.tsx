import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, Badge, BrandMark, Card, ICON_NAMES, Icon, Media } from "@tf/ui";

const meta: Meta = { title: "Atoms/Elements", decorators: [(S) => <div className="p-8"><S /></div>] };
export default meta;

export const Badges: StoryObj = {
  render: () => (
    <div className="flex gap-2">
      {(["primary", "accent", "outline", "muted"] as const).map((v) => (
        <Badge key={v} variant={v}>{v}</Badge>
      ))}
    </div>
  ),
};
export const Icons: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {ICON_NAMES.map((n) => (
        <div key={n} className="flex flex-col items-center gap-2 text-xs">
          <Icon name={n} className="size-6" />
          {n}
        </div>
      ))}
    </div>
  ),
};
export const MediaPlaceholder: StoryObj = { render: () => <Media alt="Placeholder" className="max-w-md" /> };
export const Avatars: StoryObj = {
  render: () => (
    <div className="flex gap-3">
      <Avatar name="Maya Chen" />
      <Avatar name="Daniel Ortiz" />
    </div>
  ),
};
export const BrandMarkFallback: StoryObj = {
  name: "BrandMark (broken logo → name)",
  render: () => <BrandMark name="Brightline Electrical" logo={{ src: "/missing.svg" }} />,
};
export const CardAtom: StoryObj = { name: "Card", render: () => <Card className="max-w-sm">A surface card.</Card> };
