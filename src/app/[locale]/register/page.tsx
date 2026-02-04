import { RegisterForm } from "@/components/auth/register-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTranslations } from 'next-intl/server';
import { Link } from '@/common/i18n/routing';
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default async function RegisterPage() {
    const t = await getTranslations('Register');

    return (
        <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-muted/40">
            <Button asChild variant="ghost" className="absolute left-4 top-4 md:left-8 md:top-8">
                <Link href="/" className="flex items-center gap-2">
                    <ChevronLeft className="h-4 w-4" />
                    Volver
                </Link>
            </Button>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">{t('title')}</CardTitle>
                    <CardDescription>
                        {t('description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm />
                    <div className="mt-4 text-center text-sm">
                        <Link href="/login" className="underline">
                            {t('haveAccount')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
