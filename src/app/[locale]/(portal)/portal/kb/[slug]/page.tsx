import { prisma } from "@/infrastructure/db/prisma"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Link } from '@/common/i18n/routing';
import { ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ArticleMarkdown } from "@/components/article-markdown"

import { getTranslations, getLocale } from 'next-intl/server';

interface Props {
    params: Promise<{
        slug: string
    }>
}

export default async function ArticlePage({ params }: Props) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const t = await getTranslations('Portal');
    const tAdmin = await getTranslations('Admin');
    const locale = await getLocale();
    const dateLocale = locale === 'es' ? es : enUS;

    const article = await prisma.article.findUnique({
        where: { slug: slug },
        include: {
            category: true,
            author: true
        }
    })

    if (!article || !article.isPublished) {
        notFound()
    }

    const categoryName = tAdmin.has(`KBCategories.${article.category.name}`) 
        ? tAdmin(`KBCategories.${article.category.name}`) 
        : article.category.name;

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Button asChild variant="ghost" className="pl-0 gap-2">
                <Link href="/portal/kb">
                    <ChevronLeft className="h-4 w-4" />
                    {t('backToKb')}
                </Link>
            </Button>
            <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                        {categoryName}
                    </Badge>
                    <span className="text-sm text-orange-500 font-medium">
                        {t('lastUpdatedLabel')} {format(article.updatedAt, 'MMMM d, yyyy', { locale: dateLocale })}
                    </span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
                    {article.title}
                </h1>
            </div>

            <ArticleMarkdown content={article.content} />
        </div>
    )
}
