"use server";

import { auth } from "@/core/auth";
import { prisma } from "@/infrastructure/db/prisma";
import { sendEmail } from "@/infrastructure/services/email/email-service";
import {
  getAnalytics,
  type AnalyticsPeriod,
} from "@/common/actions/analytics-actions";

// Períodos de reporte
type ReportPeriod = "weekly" | "biweekly" | "monthly" | "yearly";

// Mapeo de roles a roles superiores que pueden recibir reportes
// Jerarquía: Technician → Technical Lead → Team Lead → Manager
const ROLE_HIERARCHY: Record<string, string[]> = {
  TECHNICIAN: ["TECHNICAL_LEAD", "TEAM_LEAD", "MANAGER"],
  DEVELOPER: ["TECHNICAL_LEAD", "TEAM_LEAD", "MANAGER"],
  CONSULTANT: ["TECHNICAL_LEAD", "TEAM_LEAD", "MANAGER"],
  TECHNICAL_LEAD: ["TEAM_LEAD", "MANAGER"],
  TEAM_LEAD: ["MANAGER"],
  SERVICE_OFFICER: ["MANAGER"],
  MANAGER: ["MANAGER"],
};

// Mapeo de período a días
const PERIOD_DAYS: Record<ReportPeriod, number> = {
  weekly: 7,
  biweekly: 15,
  monthly: 30,
  yearly: 365,
};

// Mapeo a AnalyticsPeriod
const PERIOD_MAP: Record<ReportPeriod, AnalyticsPeriod> = {
  weekly: "7d",
  biweekly: "30d", // Usar 30d para quincenal
  monthly: "30d",
  yearly: "365d",
};

/**
 * Obtiene los destinatarios válidos para enviar un reporte
 * Basado en la jerarquía de roles y departamento del usuario
 */
export async function getReportRecipients() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      departmentId: true,
      name: true,
      department: { select: { name: true } },
    },
  });

  if (
    !currentUser ||
    currentUser.role === "CLIENT" ||
    currentUser.role === "VIRTUAL_ASSISTANT"
  ) {
    return { error: "Solo usuarios técnicos pueden enviar reportes" };
  }

  // Obtener los roles superiores permitidos
  const allowedRoles = ROLE_HIERARCHY[currentUser.role] || [];

  if (allowedRoles.length === 0) {
    return { recipients: [] };
  }

  // Buscar usuarios con roles superiores
  // Prioriza el mismo departamento, pero Managers pueden recibir de cualquiera
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = {
    role: { in: allowedRoles },
    id: { not: currentUser.id },
  };

  // Si tiene departamento, filtrar por departamento (excepto Managers que son globales)
  if (currentUser.departmentId) {
    whereClause.OR = [
      { departmentId: currentUser.departmentId }, // Mismo departamento
      { role: "MANAGER" }, // Managers reciben de todos
    ];
  }

  const recipients = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: { select: { name: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return {
    success: true,
    recipients,
    currentUser: {
      name: currentUser.name,
      role: currentUser.role,
      department: currentUser.department?.name,
    },
  };
}

/**
 * Envía un reporte por email a un destinatario
 */
export async function sendReport(params: {
  recipientId: string;
  period: ReportPeriod;
  message?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "No autorizado" };
  }

  const { recipientId, period, message } = params;

  // Verificar usuario actual
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      departmentId: true,
      department: { select: { name: true } },
    },
  });

  if (
    !currentUser ||
    currentUser.role === "CLIENT" ||
    currentUser.role === "VIRTUAL_ASSISTANT"
  ) {
    return { error: "Solo usuarios técnicos pueden enviar reportes" };
  }

  // Verificar destinatario
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!recipient) {
    return { error: "Destinatario no encontrado" };
  }

  // Verificar que el destinatario tiene un rol superior permitido
  const allowedRoles = ROLE_HIERARCHY[currentUser.role] || [];
  if (!allowedRoles.includes(recipient.role)) {
    return { error: "No tienes permiso para enviar reportes a este usuario" };
  }

  try {
    // Obtener datos del reporte
    const analyticsPeriod = PERIOD_MAP[period];
    const analytics = await getAnalytics(analyticsPeriod, currentUser.id);

    if ("error" in analytics) {
      return { error: "Error al obtener datos del reporte" };
    }

    // Calcular fechas del período
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - PERIOD_DAYS[period]);

    // Generar contenido del email
    const periodLabels: Record<ReportPeriod, { es: string; en: string }> = {
      weekly: { es: "Semanal", en: "Weekly" },
      biweekly: { es: "Quincenal", en: "Biweekly" },
      monthly: { es: "Mensual", en: "Monthly" },
      yearly: { es: "Anual", en: "Yearly" },
    };

    const emailBody = generateReportEmail({
      senderName: currentUser.name || currentUser.email,
      senderRole: currentUser.role,
      senderDepartment: currentUser.department?.name || "Sin departamento",
      recipientName: recipient.name || recipient.email,
      period: periodLabels[period].es,
      startDate: startDate.toLocaleDateString("es-ES"),
      endDate: endDate.toLocaleDateString("es-ES"),
      summary: analytics.summary,
      message,
    });

    // Enviar email
    await sendEmail({
      to: recipient.email,
      subject: `📊 Reporte ${periodLabels[period].es} - ${
        currentUser.name || currentUser.email
      }`,
      body: emailBody,
    });

    return {
      success: true,
      message: `Reporte enviado a ${recipient.name || recipient.email}`,
    };
  } catch (error) {
    console.error("Error sending report:", error);
    return { error: "Error al enviar el reporte" };
  }
}

/**
 * Genera el HTML del email de reporte (bilingüe)
 */
function generateReportEmail(params: {
  senderName: string;
  senderRole: string;
  senderDepartment: string;
  recipientName: string;
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    total: number;
    open: number;
    resolved: number;
    resolutionRate: number;
  };
  message?: string;
  lang?: "es" | "en";
}): string {
  const {
    senderName,
    senderRole,
    senderDepartment,
    recipientName,
    period,
    startDate,
    endDate,
    summary,
    message,
    lang = "es",
  } = params;

  // Traducciones del email
  const t = {
    es: {
      report: "Reporte",
      from: "De",
      department: "Departamento",
      to: "Para",
      period: "Período",
      ticketSummary: "Resumen de Tickets",
      totalTickets: "Total Tickets",
      open: "Abiertos",
      resolved: "Resueltos",
      resolutionRate: "Tasa Resolución",
      additionalMessage: "Mensaje adicional",
      generatedBy: "Generado por MC Support",
      noDepartment: "Sin departamento",
    },
    en: {
      report: "Report",
      from: "From",
      department: "Department",
      to: "To",
      period: "Period",
      ticketSummary: "Ticket Summary",
      totalTickets: "Total Tickets",
      open: "Open",
      resolved: "Resolved",
      resolutionRate: "Resolution Rate",
      additionalMessage: "Additional message",
      generatedBy: "Generated by MC Support",
      noDepartment: "No department",
    },
  };

  const labels = t[lang];

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${labels.report} ${period}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f4f4f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 24px; }
            .meta { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
            .meta p { margin: 4px 0; color: #64748b; font-size: 14px; }
            .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
            .stat-card { background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 32px; font-weight: bold; color: #1e293b; }
            .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
            .stat-card.primary { background: #dbeafe; }
            .stat-card.primary .stat-value { color: #1d4ed8; }
            .stat-card.success { background: #dcfce7; }
            .stat-card.success .stat-value { color: #16a34a; }
            .message { background: #fefce8; border-left: 4px solid #eab308; padding: 16px; margin: 24px 0; }
            .message p { margin: 0; color: #713f12; }
            .footer { text-align: center; padding: 16px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 ${labels.report} ${period}</h1>
            </div>
            <div class="content">
                <div class="meta">
                    <p><strong>${
                      labels.from
                    }:</strong> ${senderName} (${senderRole})</p>
                    <p><strong>${labels.department}:</strong> ${
    senderDepartment || labels.noDepartment
  }</p>
                    <p><strong>${labels.to}:</strong> ${recipientName}</p>
                    <p><strong>${
                      labels.period
                    }:</strong> ${startDate} - ${endDate}</p>
                </div>

                <h2 style="color: #1e293b; margin-bottom: 16px;">${
                  labels.ticketSummary
                }</h2>
                
                <div class="stats">
                    <div class="stat-card primary">
                        <div class="stat-value">${summary.total}</div>
                        <div class="stat-label">${labels.totalTickets}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${summary.open}</div>
                        <div class="stat-label">${labels.open}</div>
                    </div>
                    <div class="stat-card success">
                        <div class="stat-value">${summary.resolved}</div>
                        <div class="stat-label">${labels.resolved}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${summary.resolutionRate}%</div>
                        <div class="stat-label">${labels.resolutionRate}</div>
                    </div>
                </div>

                ${
                  message
                    ? `
                <div class="message">
                    <p><strong>${labels.additionalMessage}:</strong></p>
                    <p>${message}</p>
                </div>
                `
                    : ""
                }
            </div>
            <div class="footer">
                <p>${labels.generatedBy}</p>
            </div>
        </div>
    </body>
    </html>
    `;
}
