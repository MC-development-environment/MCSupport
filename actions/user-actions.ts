"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_cache } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { sendEmail, BASE_URL } from "@/lib/email-service";
import { welcomeWithPasswordEmail } from "@/lib/email-templates";

import { Prisma, UserRole } from "@prisma/client";
import { ErrorCodes } from "@/lib/error-codes";

const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Correo inválido"),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().nullable().optional(),
  password: z.string().optional(), // Optional for updates
  skills: z.string().optional(), // Comma-separated skills for smart assignment
});

export async function getUsers(
  page: number = 1,
  limit: number = 10,
  query: string = "",
  sort: string = "name",
  order: string = "asc"
) {
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {
    role: { notIn: ["ROOT", "ADMIN"] as UserRole[] }, // Exclude superusers from list
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  let orderBy: Prisma.UserOrderByWithRelationInput = { name: "asc" };

  if (sort === "email") orderBy = { email: order as Prisma.SortOrder };
  else if (sort === "role") orderBy = { role: order as Prisma.SortOrder };
  else if (sort === "department")
    orderBy = { department: { name: order as Prisma.SortOrder } };
  else if (sort === "name") orderBy = { name: order as Prisma.SortOrder };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        department: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy,
    }),
    prisma.user.count({ where }),
  ]);

  // Mapear usuarios para incluir habilidades como cadena separada por comas para el diálogo
  const usersWithSkills = users.map((user) => ({
    ...user,
    skills: user.skills
      .map((us: { skill: { name: string } }) => us.skill.name)
      .join(", "),
  }));

  return {
    users: usersWithSkills,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

export const getDepartments = unstable_cache(
  async () => {
    return await prisma.department.findMany({
      orderBy: { name: "asc" },
    });
  },
  ["departments-list"],
  { tags: ["departments"] }
);

/**
 * Sincroniza habilidades de usuario - elimina antiguas y crea nuevas vía catálogo de habilidades
 * Las habilidades son solo para personal interno, no clientes
 */
async function syncUserSkills(userId: string, skillNames: string[]) {
  // Eliminar enlaces existentes usuario-habilidad
  await prisma.userSkill.deleteMany({
    where: { userId },
  });

  // Crear nuevos enlaces de habilidad (creando entradas de catálogo si es necesario)
  for (const name of skillNames) {
    // Actualizar/Insertar habilidad en catálogo (crear si no existe)
    const skill = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    // Enlazar usuario a habilidad
    await prisma.userSkill.create({
      data: { userId, skillId: skill.id },
    });
  }
}

/**
 * Obtener habilidades de usuario como cadena separada por comas
 */
export async function getUserSkills(userId: string): Promise<string> {
  const userSkills = await prisma.userSkill.findMany({
    where: { userId },
    include: { skill: true },
  });
  return userSkills
    .map((us: { skill: { name: string } }) => us.skill.name)
    .join(", ");
}

/**
 * Obtener todas las habilidades del catálogo para autocompletado
 */
export const getAllSkills = unstable_cache(
  async (): Promise<{ id: string; name: string }[]> => {
    return prisma.skill.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },
  ["skills-list"],
  { tags: ["skills"] }
);

export async function upsertUser(values: z.infer<typeof UserSchema>) {
  const session = await auth();
  const currentUserRole = session?.user?.role;
  const isSuperUser = currentUserRole === "ROOT" || currentUserRole === "ADMIN";
  const isManager = currentUserRole === "MANAGER";

  // Solo MANAGER, ADMIN o ROOT puede gestionar usuarios
  if (!isManager && !isSuperUser) {
    return { error: ErrorCodes.PERMISSION_DENIED };
  }

  const validated = UserSchema.safeParse(values);
  if (!validated.success) {
    return { error: ErrorCodes.INVALID_DATA };
  }

  const {
    id,
    name,
    email,
    role,
    departmentId: rawDeptId,
    password,
    skills: rawSkills,
  } = validated.data;
  const departmentId = rawDeptId === "none" ? null : rawDeptId;

  // 🛡️ REGLAS DE SEGURIDAD (ROOT/ADMIN)

  // 1. Nadie puede crear o asignar el rol ROOT mediante la aplicación
  if (role === "ROOT") {
    return { error: "Operación no permitida: El rol ROOT es inmutable." };
  }

  // 2. Solo un ADMIN o ROOT puede asignar otro ADMIN
  if (role === "ADMIN" && !isSuperUser) {
    return { error: "Solo un Administrador puede asignar el rol ADMIN." };
  }

  // 3. Protección contra modificación de usuarios ROOT existentes
  if (id) {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (targetUser?.role === "ROOT") {
      return { error: "No se puede modificar ni editar al usuario ROOT." };
    }
  }

  // Procesar habilidades: separadas por coma a arreglo, limpias
  const skillsArray = rawSkills
    ? rawSkills
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0)
    : [];

  try {
    if (id) {
      // Actualizar
      const dataToUpdate: Record<string, unknown> = {
        name,
        email,
        role,
        departmentId,
      };
      if (password && password.length > 0) {
        dataToUpdate.password = await hash(password, 10);
      }

      await prisma.user.update({
        where: { id },
        data: dataToUpdate,
      });
    } else {
      // Crear
      if (!password) return { error: ErrorCodes.PASSWORD_REQUIRED };

      // Verificar existencia
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return { error: "El correo ya existe" };

      await prisma.user.create({
        data: {
          name,
          email,
          role: role,
          departmentId,
          password: await hash(password, 10),
        },
      });

      // Después de crear, sincronizar habilidades para el nuevo usuario
      if (skillsArray.length > 0 && role !== "CLIENT") {
        const newUser = await prisma.user.findUnique({ where: { email } });
        if (newUser) {
          await syncUserSkills(newUser.id, skillsArray);
        }
      }
    }

    // Sincronizar habilidades para usuario existente (caso actualizar)
    if (id && role !== "CLIENT") {
      await syncUserSkills(id, skillsArray);
    }

    revalidatePath("/admin/users");

    // Enviar correo de bienvenida con contraseña si es usuario nuevo
    if (!id && email && password) {
      await sendEmail({
        to: email,
        subject: "🎉 Bienvenido a MC Support - Tus credenciales de acceso",
        body: welcomeWithPasswordEmail(
          name,
          email,
          password,
          `${BASE_URL}/login`
        ),
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Upsert error:", error);
    if (error.code === "P2002") {
      return { error: ErrorCodes.EMAIL_EXISTS };
    }
    return { error: `Error detalle: ${error.message}` };
  }
}

export async function updateProfile(data: { name: string; password?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: ErrorCodes.UNAUTHORIZED };

  try {
    const updateData: Record<string, unknown> = { name: data.name };
    if (data.password && data.password.length > 0) {
      updateData.password = await hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Error updating profile" };
  }
}
