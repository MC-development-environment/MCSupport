"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function createArticle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email || !session.user.id)
    throw new Error("Unauthorized");

  // Validar que el usuario exista en la BD para evitar error de FK
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser) {
    throw new Error(
      "Usuario no encontrado. Su sesión puede haber expirado. Por favor inicie sesión nuevamente."
    );
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const categoryId = formData.get("categoryId") as string;
  const isPublished = formData.get("isPublished") === "on";
  const isInternal = formData.get("isInternal") === "on";

  const slug =
    title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "") +
    "-" +
    Date.now();

  const article = await prisma.article.create({
    data: {
      title,
      content,
      categoryId,
      isPublished,
      // @ts-ignore
      isInternal,
      slug,
      authorId: session.user.id,
    },
  });

  // Crear registro de auditoría para la creación del artículo
  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entity: "Article",
      entityId: article.id,
      actorId: session.user.id,
      details: {
        title,
        isPublished,
        categoryId,
      },
    },
  });

  revalidatePath("/admin/kb");
  redirect("/admin/kb");
}

export async function updateArticle(articleId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email || !session.user.id)
    throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const categoryId = formData.get("categoryId") as string;
  const isPublished = formData.get("isPublished") === "on";
  const isInternal = formData.get("isInternal") === "on";

  // Obtener artículo actual para comparación
  const currentArticle = await prisma.article.findUnique({
    where: { id: articleId },
    select: { title: true, isPublished: true, categoryId: true },
  });

  await prisma.article.update({
    where: { id: articleId },
    data: {
      title,
      content,
      categoryId,
      isPublished,
      // @ts-ignore
      isInternal,
    },
  });

  // Construir objeto de cambios para registro de auditoría
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changes: Record<string, { from: any; to: any }> = {};
  if (currentArticle?.title !== title) {
    changes.title = { from: currentArticle?.title, to: title };
  }
  if (currentArticle?.isPublished !== isPublished) {
    changes.isPublished = {
      from: currentArticle?.isPublished,
      to: isPublished,
    };
  }
  if (currentArticle?.categoryId !== categoryId) {
    changes.categoryId = { from: currentArticle?.categoryId, to: categoryId };
  }

  // Crear registro de auditoría para la actualización del artículo
  await prisma.auditLog.create({
    data: {
      action: "UPDATE",
      entity: "Article",
      entityId: articleId,
      actorId: session.user.id,
      details: {
        changes,
      },
    },
  });

  revalidatePath("/admin/kb");
  revalidatePath(`/admin/kb/${articleId}`);
  revalidatePath(`/admin/kb/${articleId}/view`);
  redirect("/admin/kb");
}
