"use client"

import { useTransition, useState } from "react" // Verify import
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { Link, useRouter } from "@/i18n/routing"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { authenticate } from "@/actions/auth-actions" // Need to create this or check if exists
import { Loader2 } from "lucide-react"


const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
})

export function LoginForm() {
    const t = useTranslations('Login');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const router = useRouter();

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    function onSubmit(values: z.infer<typeof LoginSchema>) {
        setError("");
        startTransition(async () => {
            const result = await authenticate(values);
            if (result?.error) {
                setError(result.error);
            } else {
                router.push('/admin');
                router.refresh();
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('email')}</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder={t('emailPlaceholder')}
                                        type="email"
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('password')}</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="******"
                                        type="password"
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <Button size="sm" variant="link" asChild className="px-0 font-normal">
                                    <Link href="/forgot-password">
                                        {t('forgotPassword')}
                                    </Link>
                                </Button>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                {error && (
                    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive">
                        <p>{error}</p>
                    </div>
                )}
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('submit')}
                </Button>
            </form>
        </Form>
    )
}
