import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@tf/ui";

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  args: { children: "Get started", variant: "primary", size: "md" },
  argTypes: {
    variant: { control: "select", options: ["primary", "secondary", "outline", "ghost", "link"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
  decorators: [(S) => <div className="p-8"><S /></div>],
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};
export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {(["primary", "secondary", "outline", "ghost", "link"] as const).map((v) => (
        <Button key={v} {...args} variant={v}>{v}</Button>
      ))}
    </div>
  ),
};
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      {(["sm", "md", "lg"] as const).map((s) => (
        <Button key={s} {...args} size={s}>Size {s}</Button>
      ))}
    </div>
  ),
};
export const Disabled: Story = { args: { disabled: true } };
