/**
 * Cron: Alerta de Inactividad de Colaborador
 *
 * Este endpoint verifica tickets activos (OPEN, IN_PROGRESS, WAITING_CUSTOMER)
 * donde el colaborador asignado no ha enviado ningún mensaje (interno o público)
 * en las últimas 48 horas.
 *
 * Se debe ejecutar diariamente o cada hora.
 * URL: /api/cron/collaborator-inactivity?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, BASE_URL } from "@/lib/email-service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// Configuración: Tiempo límite de inactividad (48 horas)
const INACTIVITY_THRESHOLD_HOURS = 48;

export async function GET(request: NextRequest) {
  try {
    // 1. Seguridad: Verificar Secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      logger.warn("[Cron:Inactivity] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Definir fecha límite (Hace 48 horas)
    const deadlineDate = new Date();
    deadlineDate.setHours(deadlineDate.getHours() - INACTIVITY_THRESHOLD_HOURS);

    logger.info(
      `[Cron:Inactivity] Checking tickets inactive since ${deadlineDate.toISOString()}`
    );

    // 3. Buscar tickets activos que tienen un colaborador asignado
    // Optimización: Traemos tickets que NO han sido actualizados recientemente como primer filtro
    const activeTickets = await prisma.case.findMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] },
        assignedToId: { not: null },
        // Actualizado hace más de 48h sugiere inactividad, pero verificaremos mensajes
        updatedAt: { lt: deadlineDate },
      },
      include: {
        assignedTo: {
          select: { name: true, email: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Solo necesitamos el último mensaje
        },
      },
    });

    let notificationsSent = 0;
    const details = [];

    // 4. Analizar cada ticket
    for (const ticket of activeTickets) {
      const lastMessage = ticket.messages[0];
      const lastActivity = lastMessage
        ? lastMessage.createdAt
        : ticket.createdAt;

      // Si la última actividad (mensaje o creación) fue hace más de 48h
      if (lastActivity < deadlineDate) {
        if (ticket.assignedTo?.email) {
          // Calcular tiempo exacto "sin tocar"
          const daysInactive = Math.floor(
            (new Date().getTime() - new Date(lastActivity).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          try {
            // Enviar correo al colaborador
            await sendEmail({
              to: ticket.assignedTo.email,
              subject: `⚠️ Alerta de Inactividad: Ticket #${ticket.ticketNumber}`,
              body: `
                Hola ${ticket.assignedTo.name || "Colaborador"},
                
                El ticket **#${ticket.ticketNumber} - ${
                ticket.title
              }** no ha tenido actividad (mensajes o notas) en los últimos **${daysInactive} días**.
                
                Estado actual: **${ticket.status}**
                Última actividad detectada: ${lastActivity.toLocaleString()}
                
                Por favor, revisa el caso y envía una actualización o contacta al cliente.
                
                🔗 Ir al Ticket: ${BASE_URL}/admin/tickets/${ticket.id}
                
                Gracias,
                Sistema de Soporte Multicomputos
              `,
            });

            notificationsSent++;
            details.push({
              ticket: ticket.ticketNumber,
              assignedTo: ticket.assignedTo.email,
              daysInactive,
            });

            logger.info(
              `[Cron:Inactivity] Notification sent for ticket #${ticket.ticketNumber}`
            );
          } catch (emailError) {
            logger.error(
              `[Cron:Inactivity] Failed to send email for ticket #${ticket.ticketNumber}`,
              { error: emailError }
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: activeTickets.length,
      notificationsSent,
      details,
    });
  } catch (error) {
    logger.error("[Cron:Inactivity] Process failed", { error });
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
