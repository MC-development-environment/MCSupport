import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/common/i18n/routing";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageToggle } from "@/components/language-toggle";

export default async function LoginPage() {
  const t = await getTranslations("Login");

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Button
        asChild
        variant="ghost"
        className="absolute left-4 top-4 md:left-8 md:top-8"
      >
        <Link href="/" className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          {t("back")}
        </Link>
      </Button>

      <div className="absolute right-4 top-4 flex items-center gap-2 md:right-8 md:top-8">
        <LanguageToggle />
        <ModeToggle />
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
