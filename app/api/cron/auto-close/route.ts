import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, BASE_URL } from "@/lib/email-service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 24 hours ago
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find tickets resolved > 24h ago
    const ticketsToClose = await prisma.case.findMany({
      where: {
        status: "RESOLVED",
        updatedAt: {
          lt: cutoffDate,
        },
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    logger.info(
      `[Auto-Close] Found ${ticketsToClose.length} resolved tickets to close.`
    );

    const results = [];

    for (const ticket of ticketsToClose) {
      try {
        // Close ticket
        await prisma.case.update({
          where: { id: ticket.id },
          data: {
            status: "CLOSED",
            surveyRequestedAt: new Date(),
          },
        });

        // Send Survey Email
        if (ticket.user.email) {
          const surveyLink = `${BASE_URL}/portal/tickets/${ticket.id}/survey`;
          await sendEmail({
            to: ticket.user.email,
            subject: `Ticket Cerrado - Encuesta de Satisfacción #${ticket.ticketNumber}`,
            body:
              `Hola ${ticket.user.name || "Cliente"},\n\n` +
              `Su ticket #${ticket.ticketNumber} ha sido cerrado automáticamente después de 24 horas de haber sido resuelto.\n\n` +
              `Valoramos mucho su opinión. Por favor, tómese un momento para calificar nuestro servicio:\n` +
              `${surveyLink}\n\n` +
              `Gracias,\nEquipo de Soporte`,
          });
        }

        results.push({ id: ticket.id, status: "closed" });
      } catch (err) {
        logger.error(`[Auto-Close] Failed to close ticket ${ticket.id}`, {
          error: err,
        });
        results.push({ id: ticket.id, error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      details: results,
    });
  } catch (error) {
    logger.error("[Auto-Close] Cron failed", { error });
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
