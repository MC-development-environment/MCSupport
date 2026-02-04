import { prisma } from "@/infrastructure/db/prisma"
import { auth } from "@/core/auth"
import { KbSearch } from "@/components/portal/kb-search"
import { Button } from "@/components/ui/button"
import { Link } from '@/common/i18n/routing';
import { ChevronLeft } from "lucide-react"

import { getTranslations } from 'next-intl/server';

export default async function KnowledgeBaseHome() {
    const t = await getTranslations('Portal');
    const session = await auth();
    const isInternalUser = session?.user?.role && session.user.role !== 'CLIENT';

    const categories = await prisma.category.findMany({
        include: {
            articles: {
                where: { 
                    isPublished: true,
                    // If not internal user, only show public articles
                    ...(isInternalUser ? {} : { isInternal: false })
                },
                orderBy: { updatedAt: 'desc' }
            }
        }
    })

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8">
            <div className="flex items-center gap-2">
                <Button asChild variant="ghost" className="pl-0 gap-2">
                    <Link href="/portal">
                        <ChevronLeft className="h-4 w-4" />
                        {t('back')}
                    </Link>
                </Button>
            </div>

            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">{t('kbTitle')}</h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    {t('kbSubtitle')}
                </p>
            </div>

            <KbSearch categories={categories} />
        </div>
    )
}
