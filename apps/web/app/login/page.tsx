import { ThemeScope } from "@tf/renderer";
import { Card, Heading } from "@tf/ui";
import { appTokens } from "@/lib/app-theme";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <ThemeScope tokens={appTokens} className="flex min-h-dvh items-center justify-center px-4">
      <Card className="flex w-full max-w-sm flex-col gap-5">
        <Heading as="h1" size="h3">Template Forge</Heading>
        <LoginForm />
      </Card>
    </ThemeScope>
  );
}
