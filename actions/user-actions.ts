"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { hash } from "bcryptjs"
import { z } from "zod"
import { getTranslations } from "next-intl/server"
import { auth } from "@/auth"
import { sendEmail } from "@/lib/email-service"
import { welcomeEmail } from "@/lib/email-templates"

const UserRole = {
    MANAGER: 'MANAGER',
    SERVICE_OFFICER: 'SERVICE_OFFICER',
    TEAM_LEAD: 'TEAM_LEAD',
    TECHNICAL_LEAD: 'TECHNICAL_LEAD',
    TECHNICIAN: 'TECHNICIAN',
    CONSULTANT: 'CONSULTANT',
    DEVELOPER: 'DEVELOPER',
    CLIENT: 'CLIENT'
} as const;

const UserSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nombre requerido"),
    email: z.string().email("Correo inválido"),
    role: z.nativeEnum(UserRole),
    departmentId: z.string().nullable().optional(),
    password: z.string().optional(), // Optional for updates
})

export async function getUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
            skip,
            take: limit,
            include: {
                department: true
            },
            orderBy: {
                name: 'asc'
            }
        }),
        prisma.user.count()
    ]);

    return {
        users,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
    };
}

export async function getDepartments() {
    return await prisma.department.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function upsertUser(values: z.infer<typeof UserSchema>) {
    const session = await auth();
    // Only MANAGER can manage users
    if (session?.user?.role !== 'MANAGER') {
        return { error: "No tiene permisos para administrar usuarios." };
    }

    const validated = UserSchema.safeParse(values);
    if (!validated.success) {
        return { error: "Datos inválidos" }
    }

    const { id, name, email, role, departmentId: rawDeptId, password } = validated.data;
    const departmentId = rawDeptId === "none" ? null : rawDeptId;

    try {
        if (id) {
            // Update
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dataToUpdate: any = { name, email, role, departmentId };
            if (password && password.length > 0) {
                dataToUpdate.password = await hash(password, 10);
            }

            await prisma.user.update({
                where: { id },
                data: dataToUpdate
            })
        } else {
            // Create
            if (!password) return { error: "Contraseña requerida para nuevos usuarios" };

            // Check existence
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) return { error: "El correo ya existe" };

            await prisma.user.create({
                data: {
                    name,
                    email,
                    role: role,
                    departmentId,
                    password: await hash(password, 10)
                }
            })
        }

        revalidatePath('/admin/users');

        // Send Welcome Email if new user
        if (!id && email) {
            await sendEmail({
                to: email,
                subject: 'Welcome to MC Support',
                body: welcomeEmail(name, `${process.env.NEXTAUTH_URL}/login`)
            });
        }

        return { success: true };

    } catch (error: any) {
        console.error("Upsert error:", error);
        if (error.code === 'P2002') {
            return { error: "El correo ya está registrado en el sistema." };
        }
        return { error: `Error detalle: ${error.message}` };
    }
}

export async function deleteUser(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'MANAGER') {
        return { error: "No autorizado" };
    }

    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        return { error: "Error al eliminar" };
    }
}

export async function updateProfile(data: { name: string, password?: string }) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = { name: data.name };
        if (data.password && data.password.length > 0) {
            updateData.password = await hash(data.password, 10);
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        });

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Error updating profile" };
    }
}
