"use client"

import { useState, useTransition } from "react"
import { updateProfile } from "@/actions/user-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"

interface Props {
    user: {
        name?: string | null
        email?: string | null
        role?: string
    }
}

export function ProfileForm({ user }: Props) {
    const [isPending, startTransition] = useTransition();
    const t = useTranslations('Admin');
    const [name, setName] = useState(user.name || "");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const res = await updateProfile({ name, password });
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(t('success'));
                setPassword("");
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" value={user.email || ""} disabled readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending}
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">{t('password')} (Opcional)</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    placeholder="Dejar en blanco para mantener actual"
                    suppressHydrationWarning
                />
            </div>
            <div className="grid gap-2">
                <Label>{t('role')}</Label>
                <div className="p-2 border rounded-md bg-muted text-sm text-muted-foreground">
                    {user.role}
                </div>
            </div>
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('save') || "Guardar"}
            </Button>
        </form>
    )
}
