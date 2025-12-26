"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from 'next-intl';
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createArticle, updateArticle } from "@/actions/kb-actions"
import { useTransition } from "react"

interface Category {
    id: string;
    name: string;
}

interface Article {
    id: string;
    title: string;
    content: string;
    categoryId: string;
    isPublished: boolean;
    isInternal: boolean;
}

interface ArticleFormProps {
    categories: Category[]
    article?: Article
}

export function ArticleForm({ categories, article }: ArticleFormProps) {
    const t = useTranslations('Admin.Article');
    const tKB = useTranslations('Admin.KBCategories');
    const [isPending, startTransition] = useTransition();

    // Auxiliar para traducir nombre de categoría
    const getCategoryLabel = (name: string) => {
        try {
            return tKB(name as never);
        } catch {
            return name;
        }
    };

    async function clientAction(formData: FormData) {
        startTransition(async () => {
            try {
                if (article) {
                    await updateArticle(article.id, formData);
                    toast.success(t('save') + " " + t('published')) // 'Guardar Publicado' - un poco extraño pero usa claves existentes. O solo éxito genérico.
                } else {
                    await createArticle(formData);
                    toast.success(t('create'))
                }
            } catch (e) {
                console.error(e)
                toast.error(t('error'))
            }
        })
    }

    return (
        <form action={clientAction} className="grid gap-6">
            <div className="grid gap-3">
                <Label htmlFor="title">{t('title')}</Label>
                <Input id="title" name="title" defaultValue={article?.title} placeholder={t('titlePlaceholder')} required />
            </div>

            <div className="grid gap-3">
                <Label htmlFor="category">{t('category')}</Label>
                <Select name="categoryId" required defaultValue={article?.categoryId || categories[0]?.id}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('categoryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{getCategoryLabel(cat.name)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-3">
                <Label htmlFor="content">{t('content')}</Label>
                <Textarea id="content" name="content" defaultValue={article?.content} className="min-h-[300px]" placeholder={t('contentPlaceholder')} required />
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox id="isPublished" name="isPublished" defaultChecked={article?.isPublished} />
                <Label htmlFor="isPublished">{t('publish')}</Label>
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox id="isInternal" name="isInternal" defaultChecked={article?.isInternal} />
                <Label htmlFor="isInternal">{t('internalOnly')}</Label>
            </div>

            <div className="flex items-center gap-4">
                <Button type="submit" disabled={isPending}>
                    {isPending ? t('saving') : (article ? t('update') : t('create'))}
                </Button>
            </div>
        </form>
    )
}
