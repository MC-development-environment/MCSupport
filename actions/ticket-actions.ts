"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendEmail, BASE_URL } from "@/lib/email-service";
import { logger } from "@/lib/logger";
import { statusChangeEmail, assignedEmail } from "@/lib/email-templates";

import { logActivity, AuditAction, AuditEntity } from "@/lib/audit-service";
import { z } from "zod";
import { CaseStatus, Priority } from "@prisma/client";

export async function updateTicketStatus(ticketId: string, newStatus: string) {
  await auth(); // Verificar autorización

  try {
    const ticket = await prisma.case.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket) return { success: false, error: "Ticket no encontrado" };

    const oldStatus = ticket.status;

    // SLA Logic: Pause/Resume
    let slaUpdate = {};
    const now = new Date();

    if (newStatus === "WAITING_CUSTOMER" && oldStatus !== "WAITING_CUSTOMER") {
      // PAUSE SLA
      slaUpdate = {
        slaPausedAt: now,
      };
    } else if (
      oldStatus === "WAITING_CUSTOMER" &&
      newStatus !== "WAITING_CUSTOMER"
    ) {
      // RESUME SLA
      if (ticket.slaPausedAt) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const pausedMs = now.getTime() - new Date(ticket.slaPausedAt).getTime();
        const pausedMinutes = Math.floor(pausedMs / (1000 * 60));

        slaUpdate = {
          slaPausedAt: null,
          totalPausedMinutes: { increment: pausedMinutes },
          slaTargetAt: ticket.slaTargetAt
            ? new Date(ticket.slaTargetAt.getTime() + pausedMs)
            : null,
        };
      }
    }

    // Validate Status
    const statusSchema = z.nativeEnum(CaseStatus);
    const parsedStatus = statusSchema.safeParse(newStatus);

    if (!parsedStatus.success) {
      return { success: false, error: "Estado inválido" };
    }

    await prisma.case.update({
      where: { id: ticketId },
      data: {
        status: parsedStatus.data,
        ...slaUpdate,
      },
    });

    // Sync to NetSuite
    const { NetSuiteService } = await import("@/lib/netsuite/service");
    if (ticket.netsuiteId) {
      NetSuiteService.updateCase(ticket.netsuiteId, newStatus).catch(
        console.error
      );
    }

    await logActivity(AuditAction.STATUS_CHANGE, AuditEntity.TICKET, ticketId, {
      oldStatus,
      newStatus,
      slaAdjusted: Object.keys(slaUpdate).length > 0,
    });

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath(`/admin/tickets`);
    revalidatePath(`/admin`);

    // Notificar al Cliente con CC
    const { getTicketRecipients } = await import("@/lib/ticket-helpers");
    const { AssistantService } = await import("@/lib/lau");
    const recipients = await getTicketRecipients(ticketId);

    if (recipients.to) {
      // Detectar idioma desde descripción del ticket
      const lang = AssistantService.detectLanguage(ticket.description || "");
      const subjectText =
        lang === "en" ? "Ticket Update" : "Actualización de Ticket";

      await sendEmail({
        to: recipients.to,
        cc: recipients.cc,
        subject: `${subjectText} #${ticket.ticketNumber}`,
        body: statusChangeEmail(
          ticket.ticketNumber,
          ticket.title,
          newStatus,
          `${BASE_URL}/portal/tickets/${ticketId}`,
          ticketId,
          lang
        ),
      });
    }

    // 🚀 CIERRE DE TICKET: Notificar a Jerarquía y Enviar Encuesta
    if (newStatus === "CLOSED") {
      // 1. Marcar que se solicitó encuesta
      await prisma.case.update({
        where: { id: ticketId },
        data: { surveyRequestedAt: new Date() },
      });

      const assignedUser = await prisma.user.findUnique({
        where: { id: ticket.assignedToId || "" },
        select: { departmentId: true, email: true },
      });

      // 2. Notificar Jerarquía (Internal)
      if (assignedUser?.departmentId) {
        // Buscar líderes del departamento
        const leaders = await prisma.user.findMany({
          where: {
            departmentId: assignedUser.departmentId,
            role: { in: ["TEAM_LEAD", "TECHNICAL_LEAD", "SERVICE_OFFICER"] },
          },
          select: { email: true, role: true },
        });

        // Jerarquía: Team Lead > Tech Lead > Service Officer
        const teamLead = leaders.find((u) => u.role === "TEAM_LEAD");
        const techLead = leaders.find((u) => u.role === "TECHNICAL_LEAD");
        const serviceOfficer = leaders.find(
          (u) => u.role === "SERVICE_OFFICER"
        );

        const targetLeader = teamLead || techLead || serviceOfficer;

        if (targetLeader?.email) {
          const { statusChangeEmail } = await import("@/lib/email-templates"); // Reusing status template or create new one
          await sendEmail({
            to: targetLeader.email,
            subject: `[Supervisión] Ticket Cerrado #${ticket.ticketNumber}`,
            body: `El ticket #${ticket.ticketNumber} ha sido CERRADO por ${
              assignedUser.email || "el sistema"
            }.\n\nPuede revisar los detalles aquí: ${BASE_URL}/admin/tickets/${ticketId}`,
          });
        }
      }

      // 3. Enviar Encuesta al Cliente (External)
      if (ticket.user.email) {
        // Check if user is "CLIENT" or just has email. Any user resolving a ticket might want to rate?
        // Usually internal users don't rate.
        const userWithRole = await prisma.user.findUnique({
          where: { id: ticket.userId },
          select: { role: true },
        });

        if (userWithRole?.role === "CLIENT") {
          const surveyLink = `${BASE_URL}/portal/tickets/${ticket.id}/survey`;
          await sendEmail({
            to: ticket.user.email,
            subject: `Encuesta de Satisfacción - Ticket #${ticket.ticketNumber}`,
            body:
              `Hola ${ticket.user.name || "Cliente"},\n\n` +
              `Su ticket #${ticket.ticketNumber} ha sido cerrado.\n\n` +
              `Valoramos mucho su opinión. Por favor, tómese un momento para calificar nuestro servicio:\n` +
              `${surveyLink}\n\n` +
              `Gracias,\nEquipo de Soporte`,
          });
        }
      }
    }

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath(`/admin/tickets`);
    revalidatePath(`/admin`);
    return { success: true };
  } catch (error) {
    logger.error("Failed to update ticket status", { error });
    return { success: false, error: "Error al actualizar el estado" };
  }
}

export async function assignTicket(ticketId: string, assigneeId: string) {
  await auth(); // Verificar autorización

  try {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });
    if (!assignee) return { success: false, error: "Usuario no encontrado" };

    const ticket = await prisma.case.update({
      where: { id: ticketId },
      data: { assignedToId: assigneeId },
    });

    await logActivity(AuditAction.ASSIGN, AuditEntity.TICKET, ticketId, {
      assignedTo: assignee.email,
    });

    // Notificar al Asignado
    if (assignee.email) {
      await sendEmail({
        to: assignee.email,
        subject: `Ticket Asignado #${ticket.ticketNumber}`,
        body: assignedEmail(
          ticket.ticketNumber,
          ticket.title,
          `${BASE_URL}/admin/tickets/${ticketId}`
        ),
      });
    }

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath(`/admin/tickets`);
    revalidatePath(`/admin`);
    return { success: true };
  } catch (error) {
    logger.error("Failed to assign ticket", { error });
    return { success: false, error: "Error al asignar el ticket" };
  }
}

export async function getMessages(ticketId: string) {
  const session = await auth();
  const isClient = session?.user?.role === "CLIENT";

  try {
    const messages = await prisma.message.findMany({
      where: {
        ticketId,
        ...(isClient ? { isInternal: false } : {}), // Hide internal messages from clients
      },
      include: {
        sender: {
          select: { name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return messages;
  } catch (error) {
    logger.error("Failed to get messages", { ticketId, error });
    return [];
  }
}

export async function addMessage(
  ticketId: string,
  content: string,
  isInternal: boolean = false
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  // Prevent clients from creating internal notes
  const userRole = session.user.role;
  if (userRole === "CLIENT" && isInternal) {
    return { success: false, error: "Clientes no pueden crear notas internas" };
  }

  if (!content.trim()) {
    return { success: false, error: "El contenido no puede estar vacío" };
  }

  try {
    // Obtener el ticket con información del usuario
    const ticket = await prisma.case.findUnique({
      where: { id: ticketId },
      include: { user: true, assignedTo: true },
    });

    if (!ticket) {
      return { success: false, error: "Ticket no encontrado" };
    }

    // Crear el mensaje
    await prisma.message.create({
      data: {
        content,
        ticketId,
        senderId: session.user.id,
        isInternal,
      },
    });

    // Sync Message to NetSuite
    const { NetSuiteService } = await import("@/lib/netsuite/service");
    if (ticket.netsuiteId) {
      NetSuiteService.addMessage(
        ticket.netsuiteId,
        content,
        session.user.email || "unknown"
      ).catch(console.error);
    }

    // Determinar si quien escribe es el cliente o el equipo
    const isClient = ticket.userId === session.user.id;

    // 🚀 AUTO-REAPERTURA: Si el cliente responde y está en WAITING_CUSTOMER
    if (isClient && ticket.status === "WAITING_CUSTOMER") {
      await prisma.case.update({
        where: { id: ticketId },
        data: { status: "IN_PROGRESS" },
      });

      // Obtener configuración del sistema
      const config = await prisma.systemConfig.findFirst();

      // Notificar al COLABORADOR ASIGNADO (Priority) or Support Email (Fallback)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assigneeEmail = (ticket as any).assignedTo?.email;
      const targetEmail =
        assigneeEmail || config?.supportEmail || "support@multicomputos.com";

      const subject = assigneeEmail
        ? `Cliente respondió - Ticket #${ticket.ticketNumber}`
        : `[Unassigned] Cliente respondió - Ticket #${ticket.ticketNumber}`;

      await sendEmail({
        to: targetEmail,
        subject: subject,
        body: `El cliente ha respondido al ticket #${ticket.ticketNumber}.\n\nEl estado cambió automáticamente a EN PROGRESO.\n\nVer: ${BASE_URL}/admin/tickets/${ticketId}`,
      });

      logger.info(
        `[Ticket] Auto-reopened ticket ${ticket.ticketNumber} by client response. Notified: ${targetEmail}`
      );
    } else if (isClient) {
      // Notification for normal reply (not reopening)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assigneeEmail = (ticket as any).assignedTo?.email;
      if (assigneeEmail) {
        const { newMessageEmail } = await import("@/lib/email-templates");
        // Use Spanish as default for internal notifications or detect language
        await sendEmail({
          to: assigneeEmail,
          subject: `Nuevo mensaje del cliente - Ticket #${ticket.ticketNumber}`,
          // Using a simple body or reusing a template. Reusing simple format for internal.
          body: `El cliente ha enviado un nuevo mensaje al ticket #${ticket.ticketNumber}.\n\n"${content}"\n\nVer: ${BASE_URL}/admin/tickets/${ticketId}`,
        });
      }
    }

    // 🚀 AUTO-EN-PROGRESO: Si un colaborador responde y el ticket está OPEN
    if (!isClient && ticket.status === "OPEN") {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (currentUser && currentUser.role !== "VIRTUAL_ASSISTANT") {
        await prisma.case.update({
          where: { id: ticketId },
          data: { status: "IN_PROGRESS" },
        });

        await logActivity(
          AuditAction.STATUS_CHANGE,
          AuditEntity.TICKET,
          ticketId,
          {
            oldStatus: "OPEN",
            newStatus: "IN_PROGRESS",
            reason: "Collaborator response",
          }
        );

        logger.info(
          `[Ticket] Auto-set to IN_PROGRESS ticket ${ticket.ticketNumber} by collaborator response`
        );
      }
    }

    // Notificar a la otra parte por email
    if (!isClient && ticket.user?.email) {
      // El equipo respondió → notificar al cliente con CC
      const { getTicketRecipients } = await import("@/lib/ticket-helpers");
      const recipients = await getTicketRecipients(ticketId);
      const { newMessageEmail } = await import("@/lib/email-templates");
      const { AssistantService } = await import("@/lib/lau");

      if (recipients.to) {
        // Detectar idioma desde descripción del ticket
        const lang = AssistantService.detectLanguage(ticket.description || "");
        const subjectText =
          lang === "en"
            ? "New message on your ticket"
            : "Nuevo mensaje en tu ticket";

        await sendEmail({
          to: recipients.to,
          cc: recipients.cc,
          subject: `${subjectText} #${ticket.ticketNumber}`,
          body: newMessageEmail(
            ticket.ticketNumber,
            session.user.name || "Equipo de Soporte",
            content,
            `${BASE_URL}/portal/tickets/${ticketId}`,
            lang
          ),
        });

        logger.info(
          `[Ticket] Sent new message notification to ${
            recipients.to
          } (CC: ${recipients.cc.join(", ")}) for ticket ${ticket.ticketNumber}`
        );
      }
    }

    revalidatePath(`/portal/tickets/${ticketId}`);
    revalidatePath(`/admin/tickets/${ticketId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add message", error);
    return { success: false, error: "Error al enviar el mensaje" };
  }
}

// Actualizar categoría del ticket (Solo Manager/Team Lead)
export async function updateTicketCategory(
  ticketId: string,
  newCategory: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Verificar permisos (solo MANAGER y TEAM_LEAD pueden editar categoría)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["MANAGER", "TEAM_LEAD"].includes(user.role)) {
      return { success: false, error: "Sin permisos para editar categoría" };
    }

    const oldTicket = await prisma.case.findUnique({
      where: { id: ticketId },
      select: { category: true },
    });

    await prisma.case.update({
      where: { id: ticketId },
      data: { category: newCategory as any }, // Casting a enum TicketCategory
    });

    await logActivity(AuditAction.UPDATE, AuditEntity.TICKET, ticketId, {
      field: "category",
      from: oldTicket?.category,
      to: newCategory,
    });

    revalidatePath(`/admin/tickets/${ticketId}`);
    return { success: true };
  } catch (error) {
    logger.error("Failed to update category", error);
    return { success: false, error: "Error al actualizar categoría" };
  }
}

// Reabrir un ticket cerrado con nuevo asignado
export async function reopenTicket(
  ticketId: string,
  newAssigneeId: string,
  reason: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (
      !user ||
      !["MANAGER", "SERVICE_OFFICER", "TEAM_LEAD", "TECHNICAL_LEAD"].includes(
        user.role
      )
    ) {
      return { success: false, error: "Sin permisos para reabrir casos" };
    }

    const newAssignee = await prisma.user.findUnique({
      where: { id: newAssigneeId },
      select: { name: true, email: true },
    });

    if (!newAssignee) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const ticket = await prisma.case.update({
      where: { id: ticketId },
      data: {
        status: "OPEN",
        assignedToId: newAssigneeId,
      },
    });

    // Registrar razón como nota interna
    if (reason) {
      await prisma.message.create({
        data: {
          content: `Ticket reabierto por: ${
            session.user.name || session.user.email
          }\nRazón: ${reason}\nNuevo asignado: ${newAssignee.name}`,
          ticketId,
          senderId: session.user.id,
          isInternal: true,
        },
      });
    }

    await logActivity(AuditAction.UPDATE, AuditEntity.TICKET, ticketId, {
      action: "reopen",
      newStatus: "OPEN",
      assignedTo: newAssignee.name || newAssignee.email,
      reason,
    });

    // Notificar al Nuevo Asignado
    if (newAssignee.email) {
      const { assignedEmail } = await import("@/lib/email-templates");
      await sendEmail({
        to: newAssignee.email,
        subject: `Ticket Reabierto y Asignado #${ticket.ticketNumber}`,
        body: assignedEmail(
          ticket.ticketNumber,
          ticket.title,
          `${BASE_URL}/admin/tickets/${ticketId}`
        ),
      });
    }

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath("/admin/tickets");
    return { success: true };
  } catch (error) {
    logger.error("Failed to reopen ticket", error);
    return { success: false, error: "Error al reabrir el caso" };
  }
}

// Actualizar prioridad del ticket y recalcular SLA
export async function updateTicketPriority(
  ticketId: string,
  newPriority: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "No autorizado" };
    }

    // Verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || !["MANAGER", "TEAM_LEAD"].includes(user.role)) {
      return { success: false, error: "Sin permisos para cambiar prioridad" };
    }

    const oldTicket = await prisma.case.findUnique({
      where: { id: ticketId },
      select: { priority: true, createdAt: true },
    });

    // Recalcular SLA
    const systemConfig = await prisma.systemConfig.findFirst();
    let slaTargetAt: Date | undefined;

    if (systemConfig) {
      const { calculateSlaTarget } = await import("@/lib/sla-service");

      let hours = systemConfig.slaMedium;
      switch (newPriority) {
        case "LOW":
          hours = systemConfig.slaLow;
          break;
        case "MEDIUM":
          hours = systemConfig.slaMedium;
          break;
        case "HIGH":
          hours = systemConfig.slaHigh;
          break;
        case "CRITICAL":
          hours = systemConfig.slaCritical;
          break;
      }

      // Recalcular desde FECHA DE CREACIÓN
      const startDate = oldTicket?.createdAt
        ? new Date(oldTicket.createdAt)
        : new Date();
      slaTargetAt = calculateSlaTarget(startDate, hours, systemConfig);
    }

    // Validate Priority
    const prioritySchema = z.nativeEnum(Priority);
    const parsedPriority = prioritySchema.safeParse(newPriority);

    if (!parsedPriority.success) {
      return { success: false, error: "Prioridad inválida" };
    }

    await prisma.case.update({
      where: { id: ticketId },
      data: {
        priority: parsedPriority.data,
        slaTargetAt,
      },
    });

    await logActivity(AuditAction.UPDATE, AuditEntity.TICKET, ticketId, {
      field: "priority",
      from: oldTicket?.priority,
      to: newPriority,
    });

    revalidatePath(`/admin/tickets/${ticketId}`);
    return { success: true };
  } catch (error) {
    logger.error("Failed to update priority", error);
    return { success: false, error: "Error al actualizar prioridad" };
  }
}

// Obtener departamentos con sus usuarios para diálogo de reapertura
// Obtener departamentos con sus usuarios para diálogo de reapertura
export async function getDepartmentsWithUsers() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "No autorizado" };
  }

  const userRole = session.user.role;
  const isManager = userRole === "MANAGER";

  try {
    const departments = await prisma.department.findMany({
      where: {
        ...(isManager ? {} : { name: { not: "Application" } }), // Hide Application dept from non-managers
      },
      include: {
        users: {
          where: {
            role: {
              in: [
                "MANAGER",
                "SERVICE_OFFICER",
                "TEAM_LEAD",
                "TECHNICAL_LEAD",
                "TECHNICIAN",
                "CONSULTANT",
                "DEVELOPER",
              ],
            },
          },
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, departments };
  } catch (error) {
    logger.error("Failed to get departments", error);
    return { success: false, error: "Error al obtener departamentos" };
  }
}
