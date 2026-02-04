import { prisma } from "@/infrastructure/db/prisma"
import { auth } from "@/core/auth"
import { notFound } from "next/navigation"
import { Link } from '@/common/i18n/routing';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, FileText, Book, Clock } from "lucide-react"
import { format } from "date-fns"
import { getTranslations } from 'next-intl/server';

interface Props {
    params: Promise<{
        categorySlug: string
    }>
}

export default async function CategoryPage({ params }: Props) {
    const resolvedParams = await params;
    const { categorySlug } = resolvedParams;
    const t = await getTranslations('Portal');
    const tAdmin = await getTranslations('Admin');
    const tCommon = await getTranslations('Common');

    const session = await auth();
    const isInternalUser = session?.user?.role && session.user.role !== 'CLIENT';

    const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
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

    if (!category) {
        notFound()
    }

    // Translate category name and description
    const categoryName = tAdmin.has(`KBCategories.${category.name}`) 
        ? tAdmin(`KBCategories.${category.name}`) 
        : category.name;
    
    const categoryDescription = tAdmin.has(`KBCategoryDescriptions.${category.name}`) 
        ? tAdmin(`KBCategoryDescriptions.${category.name}`) 
        : category.description;

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            {/* Navigation */}
            <Button asChild variant="ghost" className="pl-0 gap-2">
                <Link href="/portal/kb">
                    <ChevronLeft className="h-4 w-4" />
                    {t('backToKb')}
                </Link>
            </Button>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 md:p-12">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                            <Book className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-sm">
                            {category.articles.length} {category.articles.length === 1 ? tCommon('article') : tCommon('articles')}
                        </Badge>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-primary mb-3">
                        {categoryName}
                    </h1>
                    {categoryDescription && (
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            {categoryDescription}
                        </p>
                    )}
                </div>
                {/* Decorative element */}
                <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
                    <Book className="w-full h-full text-primary" />
                </div>
            </div>

            {/* Articles Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {category.articles.map(article => (
                    <Card key={article.id} className="group hover:shadow-md transition-all duration-300 hover:border-primary/30">
                        <Link href={`/portal/kb/${article.slug}`} className="block h-full">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-sm font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                            {article.title}
                                        </CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                    <Clock className="h-3 w-3" />
                                    <span className="text-orange-500 font-medium">
                                        {format(article.updatedAt, 'MMM d, yyyy')}
                                    </span>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {category.articles.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="p-4 rounded-full bg-muted mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No hay artículos</h3>
                        <p className="text-muted-foreground max-w-sm">
                            Aún no hay artículos publicados en esta categoría. Vuelve pronto.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

