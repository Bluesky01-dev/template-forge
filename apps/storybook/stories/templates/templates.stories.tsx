import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionView, ThemeScope } from "@tf/renderer";
import { getTemplate } from "@tf/templates";
import { THEMES } from "../../.storybook/themes";

/**
 * Full templates (pages). By default each renders with its own tokens;
 * set "useToolbarTheme" to re-skin it with any theme from the toolbar.
 */
interface Args {
  templateId: string;
  useToolbarTheme: boolean;
}
const meta: Meta<Args> = {
  title: "Templates/Library",
  args: { useToolbarTheme: false },
  render: ({ templateId, useToolbarTheme }, ctx) => {
    const t = getTemplate(templateId)!;
    const tokens = useToolbarTheme ? (THEMES[ctx.globals.theme as string] ?? t.doc.tokens) : t.doc.tokens;
    return (
      <ThemeScope tokens={tokens}>
        {t.doc.pages[0]!.sections.map((s) => (
          <SectionView key={s.id} section={s} tokens={tokens} />
        ))}
      </ThemeScope>
    );
  },
};
export default meta;
type Story = StoryObj<Args>;

export const Aurora: Story = { args: { templateId: "aurora" } };
export const Noir: Story = { args: { templateId: "noir" } };
export const Harvest: Story = { args: { templateId: "harvest" } };
