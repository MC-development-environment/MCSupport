"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { logActivity, AuditAction, AuditEntity } from "@/lib/audit-service";
import { z } from "zod";
import { sendEmail, BASE_URL } from "@/lib/email-service";
import { ticketCreatedEmail } from "@/lib/email-templates";
import { AssistantService } from "@/lib/lau";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { ErrorCodes } from "@/lib/error-codes";

const TicketSchema = z.object({
  title: z
    .string()
    .min(5, { message: "El título debe tener al menos 5 caracteres" }),
  description: z
    .string()
    .min(10, { message: "La descripción debe tener al menos 10 caracteres" }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("LOW"),
});

export async function createTicket(
  prevState: { success: boolean; error: string | null } | null,
  formData: FormData
): Promise<{ success: boolean; error: string | null; ticketId?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: ErrorCodes.UNAUTHORIZED };
  }

  // Límite de tasa: Verificar tickets recientes de este usuario
  const userId = session.user.id;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const recentTickets = await prisma.case.count({
    where: {
      userId,
      createdAt: { gte: fiveMinutesAgo },
    },
  });

  // Permitir máx 3 tickets cada 5 minutos
  if (recentTickets >= 3) {
    return {
      success: false,
      error:
        "Por favor espera unos minutos antes de crear otro ticket. Límite: 3 tickets cada 5 minutos.",
    };
  }

  const rawData = {
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
  };

  const validation = TicketSchema.safeParse(rawData);

  if (!validation.success) {
    const errorMessage =
      validation.error.issues[0]?.message || "Error de validación";
    return { success: false, error: errorMessage };
  }

  const { title, description, priority } = validation.data;
  const ticketNumber = "CN-" + Math.floor(Date.now() / 1000);

  // Analizar y validar correos en CC
  let ccEmailsArray: string[] = [];
  const ccEmailsRaw = formData.get("ccEmails") as string | null;
  if (ccEmailsRaw && ccEmailsRaw.trim()) {
    // Dividir por coma o punto y coma y limpiar espacios
    ccEmailsArray = ccEmailsRaw
      .split(/[,;]/)
      .map((email) => email.trim())
      .filter((email) => {
        // Validación básica de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      });

    // Validar cantidad de correos en CC (igual al límite del servicio de correo)
    const MAX_CC_RECIPIENTS = 20;
    if (ccEmailsArray.length > MAX_CC_RECIPIENTS) {
      return {
        success: false,
        error: `Máximo ${MAX_CC_RECIPIENTS} destinatarios en CC permitidos.`,
      };
    }
  }

  // Validación temprana de archivos ANTES de crear el ticket
  let validFiles: File[] = [];
  try {
    const files = formData.getAll("images") as File[];
    validFiles = files
      .filter((f) => f.size > 0 && f.name !== "undefined")
      .slice(0, 10);

    // Validar tamaño total de archivos
    const totalSize = validFiles.reduce((acc, file) => acc + file.size, 0);
    const MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB

    if (totalSize > MAX_TOTAL_SIZE) {
      console.error(
        `Total file size ${totalSize} bytes exceeds limit ${MAX_TOTAL_SIZE} bytes`
      );
      return {
        success: false,
        error: "El tamaño total de los archivos excede el límite de 20MB.",
      };
    }

    // Validar tipos de archivo
    for (const file of validFiles) {
      if (!file.type.startsWith("image/")) {
        console.error(`Invalid file type: ${file.type} for file ${file.name}`);
        return {
          success: false,
          error: "Solo se permiten archivos de imagen.",
        };
      }
      // Revisar tamaño individual de archivo
      if (file.size > 10 * 1024 * 1024) {
        console.error(`File ${file.name} exceeds 10MB limit`);
        return {
          success: false,
          error: "Cada archivo no puede exceder 10MB.",
        };
      }
    }
  } catch (error) {
    console.error("Error parsing files from FormData:", error);
    return {
      success: false,
      error:
        "Error al procesar los archivos. Por favor, intenta con archivos más pequeños.",
    };
  }

  // Verificación de seguridad para sesiones expiradas
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!dbUser) {
    return {
      success: false,
      error:
        "Usuario no inválido. Por favor cierre sesión e ingrese nuevamente.",
    };
  }

  let createdTicketId: string | null = null;

  try {
    const ticket = await prisma.case.create({
      data: {
        title,
        description,
        priority,
        status: "OPEN",
        ticketNumber,
        userId,
        ccEmails: ccEmailsArray,
      },
    });
    createdTicketId = ticket.id;

    await logActivity(AuditAction.CREATE, AuditEntity.TICKET, ticket.id, {
      title: ticket.title,
      priority: ticket.priority,
    });

    // Procesar subida de imágenes (validación ya realizada antes)
    if (validFiles.length > 0) {
      for (const file of validFiles) {
        if (file.size > 10 * 1024 * 1024) continue; // Omitir si es > 10MB
        if (!file.type.startsWith("image/")) continue; // Verificación estricta de imagen

        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Subir a Cloudinary
          const uploadResult = await uploadToCloudinary(
            buffer,
            "mc_support_tickets"
          );

          await prisma.attachment.create({
            data: {
              name: file.name,
              url: uploadResult.url,
              size: file.size,
              type: file.type,
              ticketId: ticket.id,
              userId: userId,
            },
          });
        } catch (err) {
          console.error("Error uploading file:", err);
        }
      }
    }

    if (session.user.email) {
      // Detectar idioma desde contenido del ticket
      const lang = AssistantService.detectLanguage(description);
      const subjectText = lang === "en" ? "Ticket Received" : "Ticket Recibido";

      await sendEmail({
        to: session.user.email,
        cc: ccEmailsArray,
        subject: `${subjectText}: ${ticket.ticketNumber}`,
        body: ticketCreatedEmail(
          ticket.id,
          ticket.ticketNumber,
          ticket.title,
          `${BASE_URL}/portal/tickets/${ticket.id}`,
          lang
        ),
      });
    }

    // Activar Bienvenida del Asistente
    // Ejecución asíncrona (no esperar para no bloquear UI)
    AssistantService.processTicketCreation(
      ticket.id,
      ticket.ticketNumber,
      session.user.name || "Usuario",
      ticket.title,
      ticket.description
    ).catch((err) => {
      console.error("Assistant Error:", err);
    });

    revalidatePath("/portal/tickets");
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return {
      success: false,
      error: "Error al crear el ticket. Por favor intente nuevamente.",
    };
  }

  if (createdTicketId) {
    redirect(`/portal/tickets/${createdTicketId}`);
  } else {
    redirect("/portal/tickets");
  }
}

export async function closeTicketByClient(ticketId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: ErrorCodes.UNAUTHORIZED };
  }

  try {
    // Verificar que el ticket pertenece al usuario
    const ticket = await prisma.case.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket || ticket.userId !== session.user.id) {
      return { success: false, error: ErrorCodes.NO_CLOSE_PERMISSION };
    }

    // Solo se puede cerrar si está en WAITING_CUSTOMER
    if (ticket.status !== "WAITING_CUSTOMER") {
      return {
        success: false,
        error: "El ticket debe estar esperando tu respuesta para cerrarlo",
      };
    }

    // Actualizar estado a CLOSED (Final)
    // Cuando el cliente confirma, se cierra definitivamente
    await prisma.case.update({
      where: { id: ticketId },
      data: {
        status: "CLOSED",
        surveyRequestedAt: new Date(),
      },
    });

    // Crear mensaje automático de cierre
    const { AssistantService } = await import("@/lib/lau");
    const lau = await AssistantService.getAssistantUser();

    if (lau) {
      await prisma.message.create({
        data: {
          content: `El cliente ha confirmado la resolución. Ticket CERRADO. ✅`,
          ticketId,
          senderId: lau.id,
          isInternal: false,
        },
      });
    }

    // Registrar actividad
    await logActivity(AuditAction.UPDATE, AuditEntity.TICKET, ticketId, {
      action: "closed_by_client",
      status: "CLOSED",
    });

    // Obtener configuración del sistema
    const config = await prisma.systemConfig.findFirst();

    // Notificar al equipo
    await sendEmail({
      to: config?.supportEmail || "support@multicomputos.com",
      subject: `Ticket #${ticket.ticketNumber} confirmado y cerrado por cliente`,
      body: `El cliente ${ticket.user?.name} confirmó la solución y cerró el ticket #${ticket.ticketNumber}.\n\nTítulo: ${ticket.title}\n\nVer detalles: ${BASE_URL}/admin/tickets/${ticketId}`,
    });

    // Enviar Encuesta al Cliente
    if (session.user.email) {
      const surveyLink = `${BASE_URL}/portal/tickets/${ticket.id}/survey`;
      await sendEmail({
        to: session.user.email,
        subject: `Encuesta de Satisfacción - Ticket #${ticket.ticketNumber}`,
        body:
          `Hola ${session.user.name || "Cliente"},\n\n` +
          `Gracias por confirmar la resolución del ticket #${ticket.ticketNumber}.\n\n` +
          `Nos gustaría conocer su opinión sobre el servicio recibido:\n` +
          `${surveyLink}\n\n` +
          `Gracias,\nEquipo de Soporte`,
      });
    }

    revalidatePath(`/portal/tickets/${ticketId}`);
    revalidatePath("/portal/tickets");
    revalidatePath("/admin/tickets");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Failed to close ticket:", error);
    return { success: false, error: ErrorCodes.CLOSE_TICKET_FAILED };
  }
}
export async function reopenTicketByClient(ticketId: string, reason: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: ErrorCodes.UNAUTHORIZED };
  }

  try {
    const ticket = await prisma.case.findUnique({
      where: { id: ticketId },
      include: { user: true, assignedTo: true },
    });

    if (!ticket || ticket.userId !== session.user.id) {
      return {
        success: false,
        error: "No autorizado para reabrir este ticket",
      };
    }

    if (ticket.status !== "CLOSED" && ticket.status !== "RESOLVED") {
      return { success: false, error: ErrorCodes.TICKET_NOT_CLOSED };
    }

    // Actualizar estado a OPEN
    await prisma.case.update({
      where: { id: ticketId },
      data: { status: "OPEN" },
    });

    // Registrar mensaje de razón
    if (reason) {
      await prisma.message.create({
        data: {
          content: `El cliente reabrió el ticket.\nRazón: ${reason}`,
          ticketId,
          senderId: session.user.id,
          isInternal: false,
        },
      });
    }

    // Registrar actividad
    await logActivity(AuditAction.UPDATE, AuditEntity.TICKET, ticketId, {
      action: "reopened_by_client",
      status: "OPEN",
      reason,
    });

    // Notificar al equipo (Asignado o Soporte)
    const config = await prisma.systemConfig.findFirst();
    const targetEmail =
      ticket.assignedTo?.email ||
      config?.supportEmail ||
      "support@multicomputos.com";

    await sendEmail({
      to: targetEmail,
      subject: `Ticket #${ticket.ticketNumber} reabierto por cliente`,
      body: `El cliente ${ticket.user?.name} reabrió el ticket #${ticket.ticketNumber}.\n\nRazón: ${reason}\n\nVer detalles: ${BASE_URL}/admin/tickets/${ticketId}`,
    });

    revalidatePath(`/portal/tickets/${ticketId}`);
    revalidatePath("/portal/tickets");
    revalidatePath("/admin/tickets");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Failed to reopen ticket:", error);
    return { success: false, error: ErrorCodes.REOPEN_FAILED };
  }
}

const SurveySchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function submitSurvey(ticketId: string, formData: FormData) {
  const session = await auth();
  // Allow survey even if validation limited?
  // Ideally authenticated user. If "public" survey, we need token.
  // Assuming logged in user for now.
  if (!session?.user?.id) {
    return { success: false, error: ErrorCodes.LOGIN_REQUIRED };
  }

  const rawData = {
    rating: Number(formData.get("rating")),
    comment: formData.get("comment"),
  };

  const validation = SurveySchema.safeParse(rawData);
  if (!validation.success) {
    return { success: false, error: ErrorCodes.INVALID_DATA };
  }

  const { rating, comment } = validation.data;

  try {
    const ticket = await prisma.case.findUnique({
      where: { id: ticketId },
      select: { userId: true, assignedToId: true },
    });

    if (!ticket || ticket.userId !== session.user.id) {
      return { success: false, error: ErrorCodes.UNAUTHORIZED };
    }

    // Verificar si ya existe encuesta
    const existing = await prisma.survey.findUnique({
      where: { ticketId },
    });

    if (existing) {
      return { success: false, error: ErrorCodes.ALREADY_COMPLETED };
    }

    await prisma.survey.create({
      data: {
        ticketId,
        rating,
        comment,
        resolvedById: ticket.assignedToId,
      },
    });

    revalidatePath(`/portal/tickets/${ticketId}/survey`);
    return { success: true };
  } catch (error) {
    console.error("Error submitting survey", error);
    return { success: false, error: ErrorCodes.SAVE_SURVEY_FAILED };
  }
}
