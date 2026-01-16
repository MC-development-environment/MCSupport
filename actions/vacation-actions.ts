"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ErrorCodes } from "@/lib/error-codes";
import { sendEmail, BASE_URL } from "@/lib/email-service";
import { logActivity, AuditAction, AuditEntity } from "@/lib/audit-service";
import {
  vacationActivatedEmail,
  vacationReassignmentEmail,
  vacationClientNotificationEmail,
} from "@/lib/email-templates";

interface ToggleVacationParams {
  startDate: Date;
  endDate: Date;
  message?: string;
  notifyClients?: boolean; // Check para notificar a clientes
}

interface VacationResult {
  success: boolean;
  error?: string;
  reassignedCount?: number;
  reassignedTo?: string;
}

/**
 * Activa el modo vacaciones para el usuario actual
 * - Reasigna tickets activos al Team Lead o SERVICE_OFFICER
 * - Envía notificaciones por email
 */
export async function activateVacationMode(
  params: ToggleVacationParams
): Promise<VacationResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: ErrorCodes.UNAUTHORIZED };
  }

  // Solo usuarios internos pueden activar vacaciones
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      department: true,
      assignedCases: {
        where: {
          status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] },
        },
        include: {
          user: { select: { email: true, name: true } }, // Cliente del ticket
        },
      },
    },
  });

  if (!user) {
    return { success: false, error: ErrorCodes.USER_NOT_FOUND };
  }

  if (user.role === "CLIENT") {
    return { success: false, error: ErrorCodes.PERMISSION_DENIED };
  }

  // Validar fechas
  if (params.startDate >= params.endDate) {
    return { success: false, error: ErrorCodes.INVALID_DATE_RANGE };
  }

  // Buscar destinatario para reasignación
  const reassignTo = await findReassignmentTarget(user.role, user.departmentId);

  if (!reassignTo && user.assignedCases.length > 0) {
    return { success: false, error: ErrorCodes.NO_REASSIGNMENT_TARGET };
  }

  try {
    // Activar modo vacaciones
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnVacation: true,
        vacationStartDate: params.startDate,
        vacationEndDate: params.endDate,
        vacationMessage: params.message || null,
      },
    });

    let reassignedCount = 0;

    // Reasignar tickets si hay destinatario
    if (reassignTo && user.assignedCases.length > 0) {
      await prisma.case.updateMany({
        where: {
          assignedToId: user.id,
          status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] },
        },
        data: {
          assignedToId: reassignTo.id,
        },
      });

      reassignedCount = user.assignedCases.length;

      // Registrar auditoría para cada ticket
      for (const ticket of user.assignedCases) {
        await logActivity(AuditAction.ASSIGN, AuditEntity.TICKET, ticket.id, {
          previousAssignee: user.email,
          newAssignee: reassignTo.email,
          reason: "vacation_mode",
          vacationMessage: params.message,
        });
      }

      // Enviar email al receptor de tickets
      const ticketList = user.assignedCases.map((t) => ({
        number: t.ticketNumber,
        title: t.title,
        priority: t.priority,
      }));

      await sendEmail({
        to: reassignTo.email,
        subject: `📋 ${reassignedCount} ticket(s) reasignados por vacaciones de ${user.name}`,
        body: vacationReassignmentEmail(
          reassignTo.name || reassignTo.email,
          user.name || user.email,
          ticketList,
          params.startDate,
          params.endDate,
          params.message,
          "es" // Los colaboradores internos usan español
        ),
      });

      // Notificar a clientes si está activado el check
      if (params.notifyClients) {
        for (const ticket of user.assignedCases) {
          if (ticket.user?.email) {
            await sendEmail({
              to: ticket.user.email,
              subject: `ℹ️ Tu ticket #${ticket.ticketNumber} ha sido reasignado`,
              body: vacationClientNotificationEmail(
                ticket.user.name || ticket.user.email,
                ticket.ticketNumber,
                ticket.title,
                reassignTo.name || reassignTo.email,
                params.message,
                `${BASE_URL}/portal/tickets/${ticket.id}`,
                "es" // TODO: Usar idioma preferido del cliente cuando esté disponible
              ),
            });
          }
        }
      }
    }

    // Enviar email de confirmación al usuario
    await sendEmail({
      to: user.email,
      subject: "🏝️ Modo vacaciones activado",
      body: vacationActivatedEmail(
        user.name || user.email,
        params.startDate,
        params.endDate,
        reassignedCount,
        reassignTo?.name || undefined,
        "es" // Los colaboradores internos usan español
      ),
    });

    // Auditoría
    await logActivity(AuditAction.UPDATE, AuditEntity.USER, user.id, {
      action: "vacation_activated",
      startDate: params.startDate,
      endDate: params.endDate,
      reassignedTickets: reassignedCount,
      reassignedTo: reassignTo?.email,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/portal/settings");

    return {
      success: true,
      reassignedCount,
      reassignedTo: reassignTo?.name || undefined,
    };
  } catch (error) {
    console.error("Error activating vacation mode:", error);
    return { success: false, error: ErrorCodes.INTERNAL_ERROR };
  }
}

/**
 * Desactiva el modo vacaciones
 */
export async function deactivateVacationMode(): Promise<VacationResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: ErrorCodes.UNAUTHORIZED };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isOnVacation: false,
        vacationStartDate: null,
        vacationEndDate: null,
        vacationMessage: null,
      },
    });

    await logActivity(AuditAction.UPDATE, AuditEntity.USER, session.user.id, {
      action: "vacation_deactivated",
    });

    revalidatePath("/admin/settings");
    revalidatePath("/portal/settings");

    return { success: true };
  } catch (error) {
    console.error("Error deactivating vacation mode:", error);
    return { success: false, error: ErrorCodes.INTERNAL_ERROR };
  }
}

/**
 * Obtiene el estado de vacaciones del usuario actual
 */
export async function getVacationStatus() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: ErrorCodes.UNAUTHORIZED };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      isOnVacation: true,
      vacationStartDate: true,
      vacationEndDate: true,
      vacationMessage: true,
      _count: {
        select: {
          assignedCases: {
            where: {
              status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return { error: ErrorCodes.USER_NOT_FOUND };
  }

  return {
    success: true,
    isOnVacation: user.isOnVacation,
    startDate: user.vacationStartDate,
    endDate: user.vacationEndDate,
    message: user.vacationMessage,
    activeTicketCount: user._count.assignedCases,
  };
}

/**
 * Busca el destinatario para reasignación de tickets
 * - TEAM_LEAD o MANAGER → SERVICE_OFFICER
 * - Otros → Team Lead del departamento, luego SERVICE_OFFICER
 */
async function findReassignmentTarget(
  userRole: string,
  departmentId: string | null
) {
  // TEAM_LEAD, MANAGER y SERVICE_OFFICER reasignan a otro SERVICE_OFFICER
  if (
    userRole === "TEAM_LEAD" ||
    userRole === "MANAGER" ||
    userRole === "SERVICE_OFFICER"
  ) {
    return await prisma.user.findFirst({
      where: {
        role: "SERVICE_OFFICER",
        isOnVacation: false,
      },
      select: { id: true, email: true, name: true },
      orderBy: {
        assignedCases: { _count: "asc" },
      },
    });
  }

  // Para otros roles, buscar Team Lead del departamento
  if (departmentId) {
    const teamLead = await prisma.user.findFirst({
      where: {
        departmentId,
        role: "TEAM_LEAD",
        isOnVacation: false,
      },
      select: { id: true, email: true, name: true },
    });

    if (teamLead) return teamLead;
  }

  // Fallback: SERVICE_OFFICER
  return await prisma.user.findFirst({
    where: {
      role: "SERVICE_OFFICER",
      isOnVacation: false,
    },
    select: { id: true, email: true, name: true },
    orderBy: {
      assignedCases: { _count: "asc" },
    },
  });
}

/**
 * Verifica si un usuario está de vacaciones
 * Usado para validar antes de asignar tickets
 */
export async function isUserOnVacation(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isOnVacation: true },
  });

  return user?.isOnVacation ?? false;
}
