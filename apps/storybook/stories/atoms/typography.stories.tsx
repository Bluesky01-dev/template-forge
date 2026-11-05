import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eyebrow, Heading, Text } from "@tf/ui";

const meta: Meta<typeof Heading> = {
  title: "Atoms/Typography",
  component: Heading,
  args: { children: "Ship your product faster", size: "h2" },
  argTypes: { size: { control: "select", options: ["display", "h2", "h3", "h4"] } },
  decorators: [(S) => <div className="p-8"><S /></div>],
};
export default meta;
type Story = StoryObj<typeof Heading>;

export const HeadingStory: Story = { name: "Heading" };
export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Eyebrow>Eyebrow</Eyebrow>
      <Heading size="display">Display</Heading>
      <Heading size="h2">Heading 2</Heading>
      <Heading size="h3">Heading 3</Heading>
      <Heading size="h4">Heading 4</Heading>
      <Text size="lg">Body large</Text>
      <Text>Body</Text>
      <Text size="sm" tone="muted">Small muted</Text>
    </div>
  ),
};
