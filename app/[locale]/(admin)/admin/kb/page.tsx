import { prisma } from "@/lib/prisma"
import { Link } from '@/i18n/routing';
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, FileText } from "lucide-react"
import { format } from "date-fns"
import { getTranslations } from 'next-intl/server';

export default async function KnowledgeBasePage() {
    const t = await getTranslations('Admin');
    const articles = await prisma.article.findMany({
        include: {
            category: true,
            author: true
        },
        orderBy: {
            updatedAt: 'desc'
        }
    })

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('kb')}</CardTitle>
                    <CardDescription>
                        {t('kbDescription')}
                    </CardDescription>
                </div>
                <Link href="/admin/kb/new">
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            {t('addArticle')}
                        </span>
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('ticketTitle')}</TableHead>
                                <TableHead>{t('category')}</TableHead>
                                <TableHead>{t('status')}</TableHead>
                                <TableHead className="hidden md:table-cell">{t('author')}</TableHead>
                                <TableHead className="hidden md:table-cell">{t('lastUpdated')}</TableHead>
                                <TableHead>
                                    <span className="sr-only">{t('actions')}</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {articles.map((article: any) => (
                                <TableRow key={article.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {article.title}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{article.category.name}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={article.isPublished ? 'secondary' : 'outline'}>
                                            {article.isPublished ? t('published') : t('draft')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {article.author.name}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {format(article.updatedAt, 'yyyy-MM-dd')}
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/admin/kb/${article.id}`}>
                                            <Button variant="ghost" size="sm">{t('edit')}</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {articles.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        {t('noArticles')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
