import { prisma } from "@/lib/prisma"
import { ArticleForm } from "@/components/admin/article-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from '@/i18n/routing';
import { ChevronLeft } from "lucide-react"
import { getTranslations } from 'next-intl/server';
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{
        articleId: string
    }>
}

export default async function EditArticlePage({ params }: PageProps) {
    const { articleId } = await params
    const t = await getTranslations('Admin.Article');

    const article = await prisma.article.findUnique({
        where: { id: articleId }
    })

    if (!article) {
        notFound()
    }

    const categories = await prisma.category.findMany()

    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="icon" className="h-7 w-7">
                    <Link href="/admin/kb">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
            <Card className="mx-auto w-full max-w-4xl">
                <CardHeader>
                    <CardTitle>{t('update')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ArticleForm categories={categories} article={article} />
                </CardContent>
            </Card>
        </div>
    )
}
