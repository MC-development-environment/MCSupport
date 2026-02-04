"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { auth } from "@/core/auth";
import { subDays, format, eachDayOfInterval } from "date-fns";

export type AnalyticsPeriod =
  | "7d"
  | "30d"
  | "90d"
  | "180d"
  | "365d"
  | "all"
  | "custom";

export interface AnalyticsParams {
  period?: AnalyticsPeriod;
  userId?: string;
  customStartDate?: Date;
  customEndDate?: Date;
}

export async function getAnalytics(
  periodOrParams: AnalyticsPeriod | AnalyticsParams = "7d",
  userId?: string,
) {
  const session = await auth();
  // RBAC: Gerente/Líder de Equipo/Administrador
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Soporte para ambas firmas: getAnalytics("7d", userId) y getAnalytics({ period, userId, customStartDate, customEndDate })
  let period: AnalyticsPeriod;
  let customStartDate: Date | undefined;
  let customEndDate: Date | undefined;
  let effectiveUserId: string | undefined;

  if (typeof periodOrParams === "object") {
    period = periodOrParams.period || "7d";
    effectiveUserId = periodOrParams.userId;
    customStartDate = periodOrParams.customStartDate;
    customEndDate = periodOrParams.customEndDate;
  } else {
    period = periodOrParams;
    effectiveUserId = userId;
  }

  // Calcular fechas de inicio/fin
  let startDate: Date;
  let endDate: Date = new Date();

  if (customStartDate && customEndDate) {
    // Usar fechas personalizadas
    startDate = customStartDate;
    endDate = customEndDate;
  } else {
    // Usar períodos predefinidos
    if (period === "30d") startDate = subDays(new Date(), 30);
    else if (period === "90d") startDate = subDays(new Date(), 90);
    else if (period === "180d") startDate = subDays(new Date(), 180);
    else if (period === "365d") startDate = subDays(new Date(), 365);
    else if (period === "all")
      startDate = new Date(0); // Época
    else startDate = subDays(new Date(), 7); // Default 7d
  }

  const whereClause: Prisma.CaseWhereInput = {
    createdAt: { gte: startDate, lte: endDate },
  };

  // Validar filtro de userId basado en jerarquía de roles
  if (effectiveUserId) {
    // TECHNICIAN solo puede ver sus propios datos
    if (
      session.user.role &&
      session.user.role === "TECHNICIAN" &&
      effectiveUserId !== session.user.id
    ) {
      return { error: "Unauthorized" };
    }

    // TEAM_LEAD solo puede ver usuarios en su departamento
    if (session.user.role === "TEAM_LEAD") {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { departmentId: true },
      });
      const targetUser = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        select: { departmentId: true },
      });
      if (currentUser?.departmentId !== targetUser?.departmentId) {
        return { error: "Unauthorized" };
      }
    }

    whereClause.assignedToId = effectiveUserId;
  }

  if (
    session.user.role !== "MANAGER" &&
    session.user.role !== "ROOT" &&
    session.user.role !== "ADMIN"
  ) {
    whereClause.OR = [
      { userId: session.user.id },
      { assignedToId: session.user.id },
    ];
  }

  // El alcance para Team Lead podría agregarse aquí...
  // Mantendré global por simplicidad...

  const [
    totalTickets,
    openTickets,
    resolvedTickets,
    ticketsByStatus,
    ticketsByPriority,
    recentTickets,
  ] = await Promise.all([
    prisma.case.count({ where: whereClause }),
    prisma.case.count({
      where: {
        ...whereClause,
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] },
      },
    }),
    prisma.case.count({
      where: { ...whereClause, status: { in: ["RESOLVED", "CLOSED"] } },
    }),
    prisma.case.groupBy({
      by: ["status"],
      where: whereClause,
      _count: { id: true },
    }),
    prisma.case.groupBy({
      by: ["priority"],
      where: whereClause,
      _count: { id: true },
    }),
    prisma.case.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        assignedTo: { select: { name: true, email: true } },
      },
    }),
  ]);

  // Datos de Tendencia (Tickets por día)
  // Prisma no soporta consulta "group by day" fácil...
  // Forma eficiente: Obtener createdAts...
  // Para < 10k tickets...
  const allTicketsDates = await prisma.case.findMany({
    where: whereClause,
    select: { createdAt: true, status: true },
  });

  const trendMap = new Map<string, { total: number; resolved: number }>();

  // Inicializar mapa con todos los días en el rango
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  days.forEach((day) => {
    trendMap.set(format(day, "yyyy-MM-dd"), { total: 0, resolved: 0 });
  });

  allTicketsDates.forEach((t) => {
    const key = format(t.createdAt, "yyyy-MM-dd");
    if (trendMap.has(key)) {
      const entry = trendMap.get(key)!;
      entry.total++;
      if (["RESOLVED", "CLOSED"].includes(t.status)) {
        entry.resolved++;
      }
    }
  });

  const trendData = Array.from(trendMap.entries()).map(([date, data]) => ({
    date,
    tickets: data.total,
    resolved: data.resolved,
  }));

  // Métricas SLA
  const overdueCount = await prisma.case.count({
    where: {
      ...whereClause,
      status: { notIn: ["RESOLVED", "CLOSED"] },
      slaTargetAt: { lt: new Date() },
    },
  });

  // Calcular cumplimiento SLA para tickets Resueltos/Cerrados
  // Asumimos updatedAt como tiempo de resolución por simplicidad
  const resolvedTicketsData = await prisma.case.findMany({
    where: {
      ...whereClause,
      status: { in: ["RESOLVED", "CLOSED"] },
      slaTargetAt: { not: null },
    },
    select: {
      slaTargetAt: true,
      updatedAt: true,
    },
  });

  const compliantCount = resolvedTicketsData.filter(
    (t) => t.slaTargetAt && t.updatedAt <= t.slaTargetAt,
  ).length;

  const totalRated = resolvedTicketsData.length;
  const complianceRate =
    totalRated > 0 ? Math.round((compliantCount / totalRated) * 100) : 100;

  // Métricas de Satisfacción (CSAT)
  const surveys = await prisma.survey.findMany({
    where: {
      ticket: whereClause,
    },
    select: { rating: true },
  });

  const totalSurveys = surveys.length;
  const avgRating =
    totalSurveys > 0
      ? Number(
          (
            surveys.reduce(
              (acc: number, curr: { rating: number }) => acc + curr.rating,
              0,
            ) / totalSurveys
          ).toFixed(1),
        )
      : 0;

  return {
    summary: {
      total: totalTickets,
      open: openTickets,
      resolved: resolvedTickets,
      resolutionRate:
        totalTickets > 0
          ? Math.round((resolvedTickets / totalTickets) * 100)
          : 0,
      slaCompliance: complianceRate,
      overdue: overdueCount,
      csat: avgRating,
      surveyCount: totalSurveys,
    },
    byStatus: ticketsByStatus.map((g) => ({
      name: g.status,
      value: g._count.id,
    })),
    byPriority: ticketsByPriority.map((g) => ({
      name: g.priority,
      value: g._count.id,
    })),
    trend: trendData,
    recent: recentTickets,
  };
}
