"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function createArticle(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) throw new Error("Unauthorized")

    // Validate user exists in DB to prevent FK error
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!dbUser) {
        throw new Error("Usuario no encontrado. Su sesión puede haber expirado. Por favor inicie sesión nuevamente.");
    }

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const categoryId = formData.get('categoryId') as string
    const isPublished = formData.get('isPublished') === 'on'

    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Date.now()

    await prisma.article.create({
        data: {
            title,
            content,
            categoryId,
            isPublished,
            slug,
            authorId: session.user.id,
        }
    })

    revalidatePath('/admin/kb')
    redirect('/admin/kb')
}

export async function updateArticle(articleId: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized")

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const categoryId = formData.get('categoryId') as string
    const isPublished = formData.get('isPublished') === 'on'

    await prisma.article.update({
        where: { id: articleId },
        data: {
            title,
            content,
            categoryId,
            isPublished
        }
    })

    revalidatePath('/admin/kb')
    revalidatePath(`/admin/kb/${articleId}`)
    redirect('/admin/kb')
}
