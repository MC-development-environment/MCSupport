"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createArticle, updateArticle } from "@/actions/kb-actions";
import { translateError } from "@/lib/error-codes";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";

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
  categories: Category[];
  article?: Article;
}

export function ArticleForm({ categories, article }: ArticleFormProps) {
  const t = useTranslations("Admin.Article");
  const tKB = useTranslations("Admin.KBCategories");
  const tCommon = useTranslations("Common");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // Estado controlado para preservar datos en caso de error
  const [formData, setFormData] = useState({
    title: article?.title || "",
    content: article?.content || "",
    categoryId: article?.categoryId || categories[0]?.id || "",
    isPublished: article?.isPublished || false,
    isInternal: article?.isInternal || false,
  });

  // Auxiliar para traducir nombre de categoría
  const getCategoryLabel = (name: string) => {
    try {
      return tKB(name as never);
    } catch {
      return name;
    }
  };

  // Resetear formulario para crear otro artículo
  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      categoryId: categories[0]?.id || "",
      isPublished: false,
      isInternal: false,
    });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const data = new FormData();
    data.set("title", formData.title);
    data.set("content", formData.content);
    data.set("categoryId", formData.categoryId);
    if (formData.isPublished) data.set("isPublished", "on");
    if (formData.isInternal) data.set("isInternal", "on");

    startTransition(async () => {
      try {
        if (article) {
          await updateArticle(article.id, data);
          toast.success(t("successUpdated"), {
            duration: 5000,
            action: {
              label: t("goToList"),
              onClick: () => router.push("/admin/kb"),
            },
          });
        } else {
          await createArticle(data);
          // Mostrar toast con opciones
          toast.success(t("successCreated"), {
            duration: 8000,
            action: {
              label: t("goToList"),
              onClick: () => router.push("/admin/kb"),
            },
            cancel: {
              label: t("createAnother"),
              onClick: () => resetForm(),
            },
          });
        }
      } catch (e) {
        console.error(e);
        // Usar función centralizada de traducción de errores
        const errorMessage = translateError(e, tCommon);
        toast.error(errorMessage, {
          duration: 6000,
        });
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-6">
      <div className="grid gap-3">
        <Label htmlFor="title">{t("title")}</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={t("titlePlaceholder")}
          required
        />
      </div>

      <div className="grid gap-3">
        <Label htmlFor="category">{t("category")}</Label>
        <Select
          name="categoryId"
          required
          value={formData.categoryId}
          onValueChange={(value) =>
            setFormData({ ...formData, categoryId: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("categoryPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {getCategoryLabel(cat.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="content">{t("content")}</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          className="min-h-[300px]"
          placeholder={t("contentPlaceholder")}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isPublished"
          name="isPublished"
          checked={formData.isPublished}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isPublished: checked === true })
          }
        />
        <Label htmlFor="isPublished">{t("publish")}</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isInternal"
          name="isInternal"
          checked={formData.isInternal}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isInternal: checked === true })
          }
        />
        <Label htmlFor="isInternal">{t("internalOnly")}</Label>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? t("saving") : article ? t("update") : t("create")}
        </Button>
      </div>
    </form>
  );
}
