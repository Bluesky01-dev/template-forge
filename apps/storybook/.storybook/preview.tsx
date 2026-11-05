import type { Preview } from "@storybook/react-vite";
import { ThemeScope } from "@tf/renderer";
import { THEMES } from "./themes";
import "./preview.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Token set (template or brand)",
      toolbar: { title: "Theme", icon: "paintbrush", items: Object.keys(THEMES), dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "aurora" },
  parameters: {
    layout: "fullscreen",
    options: { storySort: { order: ["Foundations", "Atoms", "Molecules", "Organisms", "Templates"] } },
  },
  decorators: [
    (Story, ctx) => (
      <ThemeScope tokens={THEMES[ctx.globals.theme as string] ?? THEMES.aurora!} className="min-h-screen">
        <Story />
      </ThemeScope>
    ),
  ],
};
export default preview;
