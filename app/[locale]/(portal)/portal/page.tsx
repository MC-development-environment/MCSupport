import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Search, PlusCircle, List, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function PortalPage() {
    const t = await getTranslations('Portal');

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">{t('title')}</h1>
            <p className="text-muted-foreground mb-6">{t('subtitle')}</p>

            <div className="relative mb-8">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={t('searchPlaceholder')}
                    className="w-full bg-background shadow-none appearance-none pl-8 md:w-2/3 lg:w-1/2"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PlusCircle className="h-5 w-5 text-primary" />
                            {t('newTicketTitle')}
                        </CardTitle>
                        <CardDescription>{t('newTicketDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/portal/tickets/new">
                            <Button className="w-full">{t('createTicket')}</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <List className="h-5 w-5 text-primary" />
                            {t('myTicketsTitle')}
                        </CardTitle>
                        <CardDescription>{t('myTicketsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/portal/tickets">
                            <Button variant="outline" className="w-full">{t('viewHistory')}</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            {t('kbTitle')}
                        </CardTitle>
                        <CardDescription>{t('kbDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/portal/kb">
                            <Button variant="secondary" className="w-full">{t('exploreArticles')}</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
