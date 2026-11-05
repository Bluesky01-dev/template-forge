import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Template Forge", template: "%s · Template Forge" },
  description: "Turn templates into on-brand pitch sites for your clients.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
