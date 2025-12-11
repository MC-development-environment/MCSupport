import { TicketForm } from "@/components/portal/ticket-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from '@/i18n/routing';
import { ChevronLeft } from "lucide-react"
import { getTranslations } from 'next-intl/server';

export default async function NewTicketPage() {
    const t = await getTranslations('Portal');

    return (
        <div className="mx-auto w-full max-w-3xl space-y-8">
            <div className="flex items-center gap-2">
                <Button asChild variant="ghost" className="pl-0 gap-2">
                    <Link href="/portal/tickets">
                        <ChevronLeft className="h-4 w-4" />
                        {t('back')}
                    </Link>
                </Button>
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">{t('newTicketTitle')}</h1>
                <p className="text-muted-foreground">{t('newTicketDesc')}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('ticketDetails')}</CardTitle>
                    <CardDescription>
                        {t('ticketFormDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TicketForm />
                </CardContent>
            </Card>
        </div>
    )
}
