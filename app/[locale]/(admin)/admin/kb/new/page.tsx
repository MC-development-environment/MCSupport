import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/article-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { ChevronLeft, LayoutDashboard } from "lucide-react";

export default async function NewArticlePage() {
  const categories = await prisma.category.findMany();

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon" className="h-7 w-7">
          <Link href="/admin/kb">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon" className="h-7 w-7">
          <Link href="/admin">
            <LayoutDashboard className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Create Article</CardTitle>
          <CardDescription>
            Add a new article to the knowledge base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ArticleForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
