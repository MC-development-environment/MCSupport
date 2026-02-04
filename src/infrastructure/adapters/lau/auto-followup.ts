/**
 * Asistente Virtual LAU - Auto Seguimiento
 * Seguimiento automático: recordatorios y cierre por inactividad
 */

import { prisma } from "@/infrastructure/db/prisma";
import { logger } from "@/infrastructure/logging/logger";
import { sendEmail } from "@/infrastructure/services/email/email-service";

import { ASSISTANT_EMAIL, DEFAULT_CONFIG } from "./constants";
import { FOLLOWUP_MESSAGES, formatMessage } from "./messages";
import { detectLanguage } from "./analyzer";

interface FollowupResult {
  reminders: number;
  warnings: number;
  closed: number;
  errors: number;
}

/**
 * Ejecuta el proceso de seguimiento automático
 * Debe ejecutarse periódicamente (cron job)
 */
export async function processAutoFollowup(): Promise<FollowupResult> {
  const result: FollowupResult = {
    reminders: 0,
    warnings: 0,
    closed: 0,
    errors: 0,
  };

  try {
    const config = await prisma.systemConfig.findFirst();
    const assistantName = config?.assistantName || "LAU";
    const reminderHours = DEFAULT_CONFIG.followupReminderHours;
    const autoCloseDays = DEFAULT_CONFIG.autoCloseAfterDays;

    const assistant = await prisma.user.findUnique({
      where: { email: ASSISTANT_EMAIL },
    });

    if (!assistant) {
      logger.error("[LAU] Assistant user not found");
      return result;
    }

    const now = new Date();

    // 1. Enviar recordatorios (tickets en WAITING_CUSTOMER por 48h)
    const reminderThreshold = new Date(
      now.getTime() - reminderHours * 60 * 60 * 1000
    );
    const warningThreshold = new Date(
      now.getTime() - (autoCloseDays - 1) * 24 * 60 * 60 * 1000
    );
    const closeThreshold = new Date(
      now.getTime() - autoCloseDays * 24 * 60 * 60 * 1000
    );

    // Tickets para recordatorio (48h sin respuesta)
    const ticketsForReminder = await prisma.case.findMany({
      where: {
        status: "WAITING_CUSTOMER",
        updatedAt: {
          lt: reminderThreshold,
          gt: warningThreshold,
        },
        // No tiene mensaje de recordatorio reciente
        messages: {
          none: {
            senderId: assistant.id,
            createdAt: { gt: reminderThreshold },
          },
        },
      },
      include: { user: true },
    });

    for (const ticket of ticketsForReminder) {
      try {
        const language = detectLanguage(ticket.description || "");
        const message = formatMessage(FOLLOWUP_MESSAGES.reminder[language], {
          assistant: assistantName,
          hours: String(reminderHours),
          ticketNumber: ticket.ticketNumber,
        });

        // Crear mensaje de recordatorio
        await prisma.message.create({
          data: {
            content: message,
            ticketId: ticket.id,
            senderId: assistant.id,
            isInternal: false,
          },
        });

        // Enviar email
        if (ticket.user?.email) {
          await sendEmail({
            to: ticket.user.email,
            subject:
              language === "es"
                ? `Recordatorio: Ticket #${ticket.ticketNumber}`
                : `Reminder: Ticket #${ticket.ticketNumber}`,
            body: `<p>${message.replace(/\n/g, "<br>")}</p>`,
          });
        }

        result.reminders++;
        logger.info(`[LAU] Sent reminder for ticket ${ticket.ticketNumber}`);
      } catch (error) {
        result.errors++;
        logger.error(
          `[LAU] Error sending reminder for ticket ${ticket.ticketNumber}`,
          { error }
        );
      }
    }

    // 2. Enviar advertencia de cierre (6 días sin respuesta)
    const ticketsForWarning = await prisma.case.findMany({
      where: {
        status: "WAITING_CUSTOMER",
        updatedAt: {
          lt: warningThreshold,
          gt: closeThreshold,
        },
        // No tiene mensaje de advertencia reciente
        messages: {
          none: {
            senderId: assistant.id,
            createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          },
        },
      },
      include: { user: true },
    });

    for (const ticket of ticketsForWarning) {
      try {
        const language = detectLanguage(ticket.description || "");
        const message = formatMessage(
          FOLLOWUP_MESSAGES.autoCloseWarning[language],
          {
            ticketNumber: ticket.ticketNumber,
          }
        );

        await prisma.message.create({
          data: {
            content: message,
            ticketId: ticket.id,
            senderId: assistant.id,
            isInternal: false,
          },
        });

        if (ticket.user?.email) {
          await sendEmail({
            to: ticket.user.email,
            subject:
              language === "es"
                ? `⚠️ Cierre automático: Ticket #${ticket.ticketNumber}`
                : `⚠️ Auto-close: Ticket #${ticket.ticketNumber}`,
            body: `<p>${message.replace(/\n/g, "<br>")}</p>`,
          });
        }

        result.warnings++;
        logger.info(
          `[LAU] Sent auto-close warning for ticket ${ticket.ticketNumber}`
        );
      } catch (error) {
        result.errors++;
        logger.error(
          `[LAU] Error sending warning for ticket ${ticket.ticketNumber}`,
          { error }
        );
      }
    }

    // 3. Cerrar automáticamente (7 días sin respuesta)
    const ticketsToClose = await prisma.case.findMany({
      where: {
        status: "WAITING_CUSTOMER",
        updatedAt: { lt: closeThreshold },
      },
      include: { user: true },
    });

    for (const ticket of ticketsToClose) {
      try {
        const language = detectLanguage(ticket.description || "");
        const message = formatMessage(FOLLOWUP_MESSAGES.autoClosed[language], {
          ticketNumber: ticket.ticketNumber,
        });

        // Actualizar estado a CLOSED
        await prisma.case.update({
          where: { id: ticket.id },
          data: { status: "CLOSED" },
        });

        // Crear mensaje de cierre
        await prisma.message.create({
          data: {
            content: message,
            ticketId: ticket.id,
            senderId: assistant.id,
            isInternal: false,
          },
        });

        // Registrar en auditoría
        const { logActivity, AuditAction, AuditEntity } = await import(
          "@/core/services/audit-service"
        );
        await logActivity(AuditAction.UPDATE, AuditEntity.TICKET, ticket.id, {
          status: "CLOSED",
          method: "auto-close",
          reason: "inactivity",
        });

        if (ticket.user?.email) {
          await sendEmail({
            to: ticket.user.email,
            subject:
              language === "es"
                ? `Ticket cerrado: #${ticket.ticketNumber}`
                : `Ticket closed: #${ticket.ticketNumber}`,
            body: `<p>${message.replace(/\n/g, "<br>")}</p>`,
          });
        }

        result.closed++;
        logger.info(`[LAU] Auto-closed ticket ${ticket.ticketNumber}`);
      } catch (error) {
        result.errors++;
        logger.error(`[LAU] Error auto-closing ticket ${ticket.ticketNumber}`, {
          error,
        });
      }
    }

    logger.info("[LAU] Auto-followup completed", result);
    return result;
  } catch (error) {
    logger.error("[LAU] Error in auto-followup process", { error });
    return result;
  }
}
