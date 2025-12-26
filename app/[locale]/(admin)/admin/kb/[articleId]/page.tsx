import { prisma } from "@/lib/prisma"
import { ArticleEditor } from "@/components/admin/article-editor"
import { Button } from "@/components/ui/button"
import { Link } from '@/i18n/routing';
import { ChevronLeft } from "lucide-react"
import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';

interface PageProps {
    params: Promise<{
        articleId: string
    }>
}

export default async function EditArticlePage({ params }: PageProps) {
    const { articleId } = await params
    const t = await getTranslations('Admin');

    const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: { category: true }
    })

    if (!article) {
        notFound()
    }

    const categories = await prisma.category.findMany()

    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Button asChild variant="ghost" className="pl-0 gap-2 w-fit">
                <Link href="/admin/kb">
                    <ChevronLeft className="h-4 w-4" />
                    {t('backToKb')}
                </Link>
            </Button>
            <div className="mx-auto w-full max-w-4xl">
                <ArticleEditor categories={categories} article={article} />
            </div>
        </div>
    )
}


