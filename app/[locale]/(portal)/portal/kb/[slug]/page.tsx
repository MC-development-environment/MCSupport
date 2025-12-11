import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import ReactMarkdown from 'react-markdown'
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Link } from '@/i18n/routing';
import { ChevronLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { getTranslations } from 'next-intl/server';

interface Props {
    params: Promise<{
        slug: string
    }>
}

export default async function ArticlePage({ params }: Props) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const t = await getTranslations('Portal');

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

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Button asChild variant="ghost" className="pl-0 gap-2">
                <Link href="/portal">
                    <ChevronLeft className="h-4 w-4" />
                    {t('backToKb')}
                </Link>
            </Button>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Badge variant="outline">{article.category.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                        {t('lastUpdatedLabel')} {format(article.updatedAt, 'MMMM d, yyyy')}
                    </span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                    {article.title}
                </h1>
            </div>

            <article className="prose prose-stone dark:prose-invert max-w-none">
                <ReactMarkdown>
                    {article.content}
                </ReactMarkdown>
            </article>
        </div>
    )
}
