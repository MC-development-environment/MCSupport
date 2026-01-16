"use client";

import { useState } from "react";
import { ArticleForm } from "@/components/admin/article-form";
import { ArticleMarkdown } from "@/components/article-markdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { Eye, Pencil } from "lucide-react";

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
  updatedAt: Date;
  category: {
    name: string;
  };
}

interface Props {
  categories: Category[];
  article: Article;
}

export function ArticleEditor({ categories, article }: Props) {
  const t = useTranslations("Admin.Article");
  const tKB = useTranslations("Admin.KBCategories");
  const [activeTab, setActiveTab] = useState<string>("edit");

  // Obtener nombre de categoría traducido
  const getCategoryLabel = (name: string) => {
    try {
      return tKB(name as never);
    } catch {
      return name;
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="edit" className="gap-2">
            <Pencil className="h-4 w-4" />
            {t("update")}
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Vista Previa
          </TabsTrigger>
        </TabsList>
        <Badge variant={article.isPublished ? "default" : "secondary"}>
          {article.isPublished ? "Publicado" : "Borrador"}
        </Badge>
      </div>

      <TabsContent value="edit" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>{t("update")}</CardTitle>
            <CardDescription>
              Edite el contenido del artículo. Usa Markdown para dar formato.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArticleForm categories={categories} article={article} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preview" className="mt-0">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {getCategoryLabel(article.category.name)}
              </Badge>
              <span className="text-sm text-orange-500 font-medium">
                Última actualización:{" "}
                {format(article.updatedAt, "MMMM d, yyyy")}
              </span>
            </div>
            <CardTitle className="text-3xl text-primary">
              {article.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ArticleMarkdown content={article.content} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
