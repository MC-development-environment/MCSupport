import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Link } from '@/i18n/routing';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Pencil, History, Clock } from "lucide-react"
import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { getTranslations, getLocale } from 'next-intl/server';
import { ArticleMarkdown } from "@/components/article-markdown"

interface PageProps {
    params: Promise<{
        articleId: string
    }>
}

export default async function ViewArticlePage({ params }: PageProps) {
    const { articleId } = await params
    const t = await getTranslations('Portal');
    const tAdmin = await getTranslations('Admin');
    const locale = await getLocale();
    const dateLocale = locale === 'es' ? es : enUS;

    const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
            category: true,
            author: true
        }
    })

    if (!article) {
        notFound()
    }

    // Get audit logs for this article
    const auditLogs = await prisma.auditLog.findMany({
        where: {
            entity: "Article",
            entityId: articleId
        },
        include: {
            actor: true
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 10
    })

    // Translate category name
    const categoryName = tAdmin.has(`KBCategories.${article.category.name}`) 
        ? tAdmin(`KBCategories.${article.category.name}`) 
        : article.category.name;

    return (
        <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                <Button asChild variant="ghost" className="pl-0 gap-2">
                    <Link href="/admin/kb">
                        <ChevronLeft className="h-4 w-4" />
                        {tAdmin('backToKb')}
                    </Link>
                </Button>
                <Button asChild variant="default" size="sm" className="gap-2">
                    <Link href={`/admin/kb/${article.id}`}>
                        <Pencil className="h-4 w-4" />
                        {tAdmin('edit')}
                    </Link>
                </Button>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main content */}
                <Card className="lg:col-span-2">
                    <CardHeader className="border-b">
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                            <Badge variant="secondary" className="gap-1 text-xs font-medium bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                {categoryName}
                            </Badge>
                            {article.isPublished ? (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25">
                                    {tAdmin('published')}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                    {tAdmin('draft')}
                                </Badge>
                            )}
                            <span className="text-sm text-orange-500 font-medium">
                                {t('lastUpdatedLabel')} {format(article.updatedAt, 'MMMM d, yyyy', { locale: dateLocale })}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-primary">
                            {article.title}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2">
                            {tAdmin('createdBy')} {article.author.name}
                        </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <ArticleMarkdown content={article.content} />
                    </CardContent>
                </Card>

                {/* Sidebar with audit log */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                <History className="h-4 w-4" />
                                {locale === 'es' ? 'Historial de Cambios' : 'Change History'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {auditLogs.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    {locale === 'es' ? 'Sin cambios registrados' : 'No changes recorded'}
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {auditLogs.map((log) => (
                                        <div key={log.id} className="flex gap-3 text-sm">
                                            <div className="mt-0.5">
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <p className="font-medium">
                                                    {log.action === 'CREATE' 
                                                        ? (locale === 'es' ? 'Creado' : 'Created')
                                                        : (locale === 'es' ? 'Actualizado' : 'Updated')
                                                    }
                                                </p>
                                                <p className="text-muted-foreground">
                                                    {log.actor.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(log.createdAt, 'PPp', { locale: dateLocale })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

