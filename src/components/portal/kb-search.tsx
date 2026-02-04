"use client"

import { Link } from '@/common/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Book, ChevronRight } from "lucide-react"
import { useState } from "react"

interface Article {
    id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    isInternal: boolean;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    articles: Article[];
}

interface Props {
    categories: Category[]
}

import { useTranslations } from 'next-intl';

export function KbSearch({ categories }: Props) {
    const t = useTranslations('Portal');
    const tKB = useTranslations('Admin.KBCategories');
    const tKBDesc = useTranslations('Admin.KBCategoryDescriptions');
    const [searchTerm, setSearchTerm] = useState("")

    // Ayuda para traducir nombre de categoría
    const getCategoryLabel = (name: string) => {
        try {
            return tKB(name as never);
        } catch {
            return name;
        }
    };

    // Ayuda para traducir descripción de categoría
    const getCategoryDescription = (name: string, fallback: string | null) => {
        try {
            return tKBDesc(name as never);
        } catch {
            return fallback || '';
        }
    };

    const filteredCategories = categories.map(cat => ({
        ...cat,
        articles: cat.articles.filter(article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.articles.length > 0 || searchTerm === "")

    return (
        <div className="space-y-8">
            <div className="relative mx-auto max-w-lg">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder={t('searchArticles')}
                    className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map(category => {
                    const displayedArticles = category.articles.slice(0, 3);
                    const hasMoreArticles = category.articles.length > 3;
                    
                    return (
                        <Card key={category.id} className="flex flex-col">
                            <Link href={`/portal/kb/category/${category.slug}`}>
                                <CardHeader className="hover:bg-muted/50 transition-colors rounded-t-lg cursor-pointer">
                                    <CardTitle className="flex items-center gap-2">
                                        <Book className="h-5 w-5 text-primary" />
                                        {getCategoryLabel(category.name)}
                                        <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                                    </CardTitle>
                                    <CardDescription>
                                        {getCategoryDescription(category.name, category.description)}
                                    </CardDescription>
                                </CardHeader>
                            </Link>
                            <CardContent className="grid gap-2 text-sm flex-1">
                                {displayedArticles.map(article => (
                                    <Link 
                                        key={article.id} 
                                        href={`/portal/kb/${article.slug}`} 
                                        className="hover:underline line-clamp-1 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        • {article.title}
                                    </Link>
                                ))}
                                {category.articles.length === 0 && (
                                    <span className="text-muted-foreground italic text-xs">
                                        No hay artículos aún
                                    </span>
                                )}
                            </CardContent>
                            {hasMoreArticles && (
                                <CardFooter className="pt-0">
                                    <Link 
                                        href={`/portal/kb/category/${category.slug}`}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Ver {category.articles.length - 3} más →
                                    </Link>
                                </CardFooter>
                            )}
                        </Card>
                    );
                })}
                {filteredCategories.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground">
                        {t('noArticlesFound')} &quot;{searchTerm}&quot;.
                    </div>
                )}
            </div>
        </div>
    )
}
