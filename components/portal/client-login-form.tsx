"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { signIn } from "next-auth/react"

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
import { requestOtp } from "@/actions/otp-actions"
import { toast } from "sonner"
import { Loader2, Mail } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

const EmailSchema = z.object({
    email: z.string().email("Correo inválido"),
})

const CodeSchema = z.object({
    code: z.string().min(6, "Debe tener 6 dígitos"),
})

export function ClientLoginForm() {
    const t = useTranslations('Login.Otp');
    const [isPending, startTransition] = useTransition();
    const [step, setStep] = useState<"EMAIL" | "CODE">("EMAIL");
    const [email, setEmail] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/portal/tickets";

    const emailForm = useForm<z.infer<typeof EmailSchema>>({
        resolver: zodResolver(EmailSchema),
        defaultValues: { email: "" }
    })

    const codeForm = useForm<z.infer<typeof CodeSchema>>({
        resolver: zodResolver(CodeSchema),
        defaultValues: { code: "" }
    })

    function onRequestOtp(values: z.infer<typeof EmailSchema>) {
        startTransition(async () => {
            const result = await requestOtp(values.email);
            if (result.error) {
                toast.error(result.error);
            } else {
                setEmail(values.email);
                setStep("CODE");
                toast.success(result.message);
            }
        })
    }

    function onVerifyOtp(values: z.infer<typeof CodeSchema>) {
        startTransition(async () => {
            const result = await signIn("otp", {
                email,
                code: values.code,
                redirect: false,
            });

            if (result?.error) {
                toast.error(t('invalidCredentials')); // O error genérico
            } else {
                router.push(callbackUrl);
                toast.success("Bienvenido!");
            }
        })
    }

    if (step === "EMAIL") {
        return (
            <div className="grid gap-6">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">{t('step1Title')}</h1>
                    <p className="text-sm text-muted-foreground">
                        Ingrese su correo para recibir un código de acceso.
                    </p>
                </div>
                <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(onRequestOtp)} className="space-y-4">
                        <FormField
                            control={emailForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input disabled={isPending} placeholder={t('emailPlaceholder')} type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('sendCode')}
                        </Button>
                    </form>
                </Form>
            </div>
        )
    }

    return (
        <div className="grid gap-6">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">{t('step2Title')}</h1>
                <p className="text-sm text-muted-foreground">
                    Enviado a: <span className="font-medium text-foreground">{email}</span>
                </p>
            </div>
            <Form {...codeForm}>
                <form onSubmit={codeForm.handleSubmit(onVerifyOtp)} className="space-y-4">
                    <FormField
                        control={codeForm.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        disabled={isPending}
                                        placeholder={t('codePlaceholder')}
                                        className="text-center text-lg tracking-widest"
                                        maxLength={6}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('verify')}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setStep("EMAIL")}
                        disabled={isPending}
                    >
                        Volver / Cambiar Correo
                    </Button>
                </form>
            </Form>
        </div>
    )
}
