/**
 * Cron: Reportes Automatizados
 *
 * Envía reportes de rendimiento a:
 * - Técnicos (Sus métricas personales)
 * - Managers (Métricas de su departamento)
 * - Admins (Métricas globales)
 *
 * Frecuencia controlada por SystemConfig.
 * URL: /api/cron/automated-reports?secret=CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";
import { sendEmail } from "@/infrastructure/services/email/email-service";
import { logger } from "@/infrastructure/logging/logger";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";

export const dynamic = "force-dynamic";

// Hora de ejecución objetivo (e.g., 9 AM)
const TARGET_HOUR = 9;

export async function GET(request: NextRequest) {
  try {
    // 1. Seguridad
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verificar Hora (Para evitar envíos múltiples si el cron corre cada hora)
    // En producción real, idealmente el cron job se configura para 9AM, pero si es hourly:
    const currentHour = new Date().getHours();
    if (currentHour !== TARGET_HOUR) {
      return NextResponse.json({
        message: "Skipping, not target hour",
        currentHour,
        target: TARGET_HOUR,
      });
    }

    // 3. Cargar Configuración
    const config = await prisma.systemConfig.findFirst();
    if (!config?.automatedReportsEnabled) {
      return NextResponse.json({
        message: "Automated reports disabled in settings",
      });
    }

    // 4. Verificar Frecuencia
    const today = new Date();
    let shouldRun = false;
    let dateRange = { start: new Date(), end: new Date() };
    let reportTitle = "";

    switch (config.reportFrequency) {
      case "DAILY":
        shouldRun = true; // Corre todos los días a las 9
        dateRange = {
          start: startOfDay(subDays(today, 1)),
          end: endOfDay(subDays(today, 1)),
        };
        reportTitle = "Reporte Diario";
        break;
      case "WEEKLY":
        // Correr solo los Lunes (Day 1)
        if (today.getDay() === 1) {
          shouldRun = true;
          dateRange = {
            start: startOfWeek(subWeeks(today, 1)),
            end: endOfWeek(subWeeks(today, 1)),
          };
          reportTitle = "Reporte Semanal";
        }
        break;
      case "MONTHLY":
        // Correr el día 1 del mes
        if (today.getDate() === 1) {
          shouldRun = true;
          dateRange = {
            start: startOfMonth(subMonths(today, 1)),
            end: endOfMonth(subMonths(today, 1)),
          };
          reportTitle = "Reporte Mensual";
        }
        break;
      case "ANNUAL":
        // Correr el 1 de Enero
        if (today.getDate() === 1 && today.getMonth() === 0) {
          shouldRun = true;
          dateRange = {
            start: startOfYear(subYears(today, 1)),
            end: endOfYear(subYears(today, 1)),
          };
          reportTitle = "Reporte Anual";
        }
        break;
    }

    if (!shouldRun) {
      return NextResponse.json({
        message: "Skipping, frequency condition not met",
        frequency: config.reportFrequency,
      });
    }

    logger.info(`[Cron:Reports] Starting ${reportTitle} generation...`);

    // 5. Cargar Destinatarios
    if (!config.reportRecipients || config.reportRecipients.length === 0) {
      return NextResponse.json({ message: "No recipients configured" });
    }

    const recipients = await prisma.user.findMany({
      where: { id: { in: config.reportRecipients } },
      include: { department: true },
    });

    let sentCount = 0;

    // 6. Generar reporte individualizado
    for (const user of recipients) {
      try {
        let statsHtml = "";
        const emailSubject = `${reportTitle} - ${config.companyName}`;

        // ESTRATEGIA POR ROL
        if (user.role === "MANAGER" && user.departmentId) {
          // Métricas DEPARTAMENTALES
          const stats = await getDepartmentStats(user.departmentId, dateRange);
          statsHtml = `
                    <h3>Resumen del Departamento: ${user.department?.name}</h3>
                    <ul>
                        <li>Nuevos Tickets: <strong>${stats.newTickets}</strong></li>
                        <li>Resueltos: <strong>${stats.resolvedTickets}</strong></li>
                        <li>Tiempo Promedio Respuesta: <strong>${stats.avgResponseTime} min</strong></li>
                        <li>Satisfacción (CSAT): <strong>${stats.csat}%</strong></li>
                    </ul>
                `;
        } else if (
          ["TECHNICAL_LEAD", "SHOP_MANAGER", "MANAGER", "ADMIN"].includes(
            user.role
          ) &&
          !user.departmentId
        ) {
          // Métricas GLOBALES (Si es manager/admin sin depto, o rol alto)
          const stats = await getGlobalStats(dateRange);
          statsHtml = `
                    <h3>Resumen Global de Operaciones</h3>
                    <ul>
                        <li>Total Nuevos Tickets: <strong>${stats.newTickets}</strong></li>
                        <li>Total Resueltos: <strong>${stats.resolvedTickets}</strong></li>
                        <li>Tickets Abiertos Activos: <strong>${stats.openTickets}</strong></li>
                        <li>Satisfacción Global: <strong>${stats.csat}%</strong></li>
                    </ul>
                `;
        } else {
          // Métricas PERSONALES (Técnicos)
          const stats = await getPersonalStats(user.id, dateRange);
          statsHtml = `
                    <h3>Tu Rendimiento Personal</h3>
                    <ul>
                        <li>Tickets Asignados: <strong>${stats.assigned}</strong></li>
                        <li>Tickets Resueltos por ti: <strong>${stats.resolved}</strong></li>
                        <li>Tu CSAT Promedio: <strong>${stats.csat}%</strong></li>
                    </ul>
                `;
        }

        // Enviar Correo
        await sendEmail({
          to: user.email,
          subject: emailSubject,
          body: `
                    Hola ${user.name},
                    <br/><br/>
                    Aquí tienes el <strong>${reportTitle}</strong> generado automáticamente.
                    <br/><br/>
                    ${statsHtml}
                    <br/>
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin">Ver Dashboard Completo</a>
                    <br/><br/>
                    Saludos,<br/>
                    ${config.companyName}
                `,
        });
        sentCount++;
      } catch (err) {
        logger.error(`[Cron:Reports] Failed to send to ${user.email}`, {
          error: err,
        });
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    logger.error("[Cron:Reports] Critical error", { error });
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// --- Helpers de Estadísticas ---

async function getDepartmentStats(
  deptId: string,
  range: { start: Date; end: Date }
) {
  // Simplificación Senior: En un sistema real esto usaría aggregation queries más complejas
  // Aquí hacemos counts directos para eficiencia razonable
  const newTickets = await prisma.case.count({
    where: {
      user: { departmentId: deptId },
      createdAt: { gte: range.start, lte: range.end },
    },
  });

  const resolvedTickets = await prisma.case.count({
    where: {
      user: { departmentId: deptId },
      status: "RESOLVED",
      updatedAt: { gte: range.start, lte: range.end },
    },
  });

  // CSAT promedio del departamento
  const surveys = await prisma.survey.aggregate({
    _avg: { rating: true },
    where: {
      ticket: {
        user: { departmentId: deptId },
        createdAt: { gte: range.start, lte: range.end },
      },
    },
  });

  return {
    newTickets,
    resolvedTickets,
    avgResponseTime: 0, // TODO: Implementar cálculo real
    csat: surveys._avg.rating ? (surveys._avg.rating * 20).toFixed(1) : "N/A", // 5 stars -> 100%
  };
}

async function getGlobalStats(range: { start: Date; end: Date }) {
  const newTickets = await prisma.case.count({
    where: { createdAt: { gte: range.start, lte: range.end } },
  });
  const resolvedTickets = await prisma.case.count({
    where: {
      status: "RESOLVED",
      updatedAt: { gte: range.start, lte: range.end },
    },
  });
  const openTickets = await prisma.case.count({ where: { status: "OPEN" } }); // Snapshot actual

  const surveys = await prisma.survey.aggregate({
    _avg: { rating: true },
    where: { createdAt: { gte: range.start, lte: range.end } },
  });

  return {
    newTickets,
    resolvedTickets,
    openTickets,
    csat: surveys._avg.rating ? (surveys._avg.rating * 20).toFixed(1) : "N/A",
  };
}

async function getPersonalStats(
  userId: string,
  range: { start: Date; end: Date }
) {
  const assigned = await prisma.case.count({
    where: {
      assignedToId: userId,
      createdAt: { gte: range.start, lte: range.end },
    },
  });

  const resolved = await prisma.case.count({
    where: {
      assignedToId: userId,
      status: "RESOLVED",
      updatedAt: { gte: range.start, lte: range.end },
    },
  });

  const surveys = await prisma.survey.aggregate({
    _avg: { rating: true },
    where: {
      ticket: { assignedToId: userId },
      createdAt: { gte: range.start, lte: range.end },
    },
  });

  return {
    assigned,
    resolved,
    csat: surveys._avg.rating ? (surveys._avg.rating * 20).toFixed(1) : "N/A",
  };
}
