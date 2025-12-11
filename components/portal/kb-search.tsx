"use client"

import { Link } from '@/i18n/routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Book } from "lucide-react"
import { useState } from "react"

interface Article {
    id: string;
    title: string;
    slug: string;
    isPublished: boolean;
}

interface Category {
    id: string;
    name: string;
    description: string | null;
    articles: Article[];
}

interface Props {
    categories: Category[]
}

import { useTranslations } from 'next-intl';

export function KbSearch({ categories }: Props) {
    const t = useTranslations('Portal');
    const [searchTerm, setSearchTerm] = useState("")

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
                {filteredCategories.map(category => (
                    <Card key={category.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Book className="h-5 w-5 text-primary" />
                                {category.name}
                            </CardTitle>
                            <CardDescription>
                                {category.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-2 text-sm">
                            {category.articles.map(article => (
                                <Link key={article.id} href={`/portal/kb/${article.slug}`} className="hover:underline line-clamp-1">
                                    {article.title}
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                ))}
                {filteredCategories.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground">
                        {t('noArticlesFound')} &quot;{searchTerm}&quot;.
                    </div>
                )}
            </div>
        </div>
    )
}
