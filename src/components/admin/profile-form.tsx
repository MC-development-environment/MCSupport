"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useTransition } from "react";
import { updateProfile } from "@/common/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { translateError } from "@/core/services/error-codes";

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function ProfileForm({ user }: Props) {
  const [isPending, startTransition] = useTransition();
  const { update } = useSession();
  const router = useRouter();
  const t = useTranslations("Admin");
  const tCommon = useTranslations("Common");
  const tPortal = useTranslations("Portal");
  const tRole = useTranslations("Enums.Role");
  const [name, setName] = useState(user.name || "");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile({ name, password });
      if (res.error) {
        toast.error(translateError(res.error, tCommon));
      } else {
        // Actualizar token de sesión con nuevo nombre
        await update({ name });
        // Forzar re-renderizado de componentes de servidor
        router.refresh();
        toast.success(t("success"));
        setPassword("");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          value={user.email || ""}
          disabled
          readOnly
          className="bg-muted"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{tPortal("passwordOptional")}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          placeholder={tPortal("passwordPlaceholder")}
          suppressHydrationWarning
        />
      </div>
      <div className="grid gap-2">
        <Label>{t("role")}</Label>
        <div className="p-2 border rounded-md bg-muted text-sm text-muted-foreground">
          {user.role ? tRole(user.role as any) : ""}
        </div>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("save") || "Guardar"}
      </Button>
    </form>
  );
}
