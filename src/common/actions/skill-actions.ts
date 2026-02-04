"use server";

import { auth } from "@/core/auth";
import { prisma } from "@/infrastructure/db/prisma";
import { revalidatePath } from "next/cache";

// Helper para determinar nivel de jerarquía (Mayor número = Mayor jerarquía)
function getRoleLevel(role: string | null | undefined): number {
  if (!role) return 0;
  const roleStr = role.toString();
  switch (roleStr) {
    case "ROOT":
      return 100;
    case "ADMIN":
      return 90;
    case "MANAGER":
      return 80;
    case "SERVICE_OFFICER":
      return 70;
    case "TEAM_LEAD":
      return 60;
    case "TECHNICAL_LEAD":
      return 50;
    case "CONSULTANT":
      return 40;
    case "DEVELOPER":
      return 30;
    case "TECHNICIAN":
      return 20;
    case "CLIENT":
      return 10;
    case "VIRTUAL_ASSISTANT":
      return 0;
    default:
      return 0;
  }
}

export async function addSkill(userId: string, skillId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // Verificar que el usuario objetivo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) return { error: "User not found" };

    // Solo un usuario puede editar sus propios skills o un superior?
    // Asumiremos que uno puede editar sus propios skills, y superiores pueden editar los de subordinados.
    const currentUserRoleLevel = getRoleLevel(session.user.role || "CLIENT");
    const targetUserRoleLevel = getRoleLevel(targetUser.role || "CLIENT");

    if (
      userId !== session.user.id &&
      currentUserRoleLevel <= targetUserRoleLevel
    ) {
      return {
        error:
          "Unauthorized - Cannot assign skills to users of higher or equal hierarchy",
      };
    }

    await prisma.userSkill.create({
      data: {
        userId,
        skillId,
        assignedById: session.user.id,
      },
    });

    revalidatePath("/admin/users"); // O la ruta pertinente
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding skill:", error);
    return { error: "Failed to add skill" };
  }
}

export async function removeSkill(userId: string, skillId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const userSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
      include: {
        assignedBy: { select: { id: true, role: true } },
      },
    });

    if (!userSkill) return { error: "Skill not found for this user" };

    const currentUserRoleLevel = getRoleLevel(session.user.role || "CLIENT");

    // Regla: "si un administrador, manager o lider de equipo ponen alguna en un colaborador de menor jerarquia, el colaborador no podra eliminarla"

    // Caso 1: El usuario intenta eliminar su propio skill
    if (session.user.id === userId) {
      if (userSkill.assignedBy) {
        const assignerRoleLevel = getRoleLevel(
          userSkill.assignedBy.role || "CLIENT",
        );
        // Si quien la asignó tiene MAYOR jerarquía que el usuario actual, NO puede eliminarla
        if (assignerRoleLevel > currentUserRoleLevel) {
          return { error: "Cannot remove a skill assigned by a superior." };
        }
      }
      // Si no fue asignado por nadie (legacy) o por alguien de menor/igual nivel, puede borrarla.
    }
    // Caso 2: Alguien más intenta eliminar el skill de otro usuario
    else {
      // Solo un superior al usuario dueño del skill Y al asignador original puede eliminarla
      if (userSkill.assignedBy) {
        const assignerRoleLevel = getRoleLevel(
          userSkill.assignedBy.role || "CLIENT",
        );
        if (currentUserRoleLevel <= assignerRoleLevel) {
          return {
            error:
              "Unauthorized - Cannot remove skill assigned by someone of equal or higher rank.",
          };
        }
      }

      // Verificar jerarquía sobre el usuario dueño del skill
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      const targetUserRoleLevel = getRoleLevel(targetUser?.role || "CLIENT");

      if (currentUserRoleLevel <= targetUserRoleLevel) {
        return {
          error:
            "Unauthorized - Cannot manage skills of equal or higher rank users.",
        };
      }
    }

    await prisma.userSkill.delete({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing skill:", error);
    return { error: "Failed to remove skill" };
  }
}

export async function getSkillCatalog() {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: "asc" },
    });
    return skills;
  } catch (error) {
    console.error("Error getting skill catalog:", error);
    return [];
  }
}
