import { prisma } from "@/lib/prisma";
import { startOfMonth, subDays, subMonths } from "date-fns";
import { unstable_cache } from "next/cache";

async function calculateDashboardStats(userId?: string, role?: string) {
  // 1. Definir filtros basados en Rol - ROOT, ADMIN y MANAGER ven todos los tickets
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let whereClause: any = {};
  const fullAccessRoles = ["ROOT", "ADMIN", "MANAGER"];
  if (!fullAccessRoles.includes(role || "") && userId) {
    whereClause = {
      OR: [{ userId: userId }, { assignedToId: userId }],
    };
  }

  // 2. Total Tickets y Crecimiento
  const totalTickets = await prisma.case.count({ where: whereClause });

  // Cálculo de Crecimiento (Este Mes vs Mes Pasado)
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const startOfLastMonth = startOfMonth(subMonths(now, 1));

  const ticketsThisMonth = await prisma.case.count({
    where: {
      ...whereClause,
      createdAt: { gte: startOfCurrentMonth },
    },
  });

  const ticketsLastMonth = await prisma.case.count({
    where: {
      ...whereClause,
      createdAt: {
        gte: startOfLastMonth,
        lt: startOfCurrentMonth,
      },
    },
  });

  let ticketGrowth = 0;
  if (ticketsLastMonth > 0) {
    ticketGrowth =
      ((ticketsThisMonth - ticketsLastMonth) / ticketsLastMonth) * 100;
  } else if (ticketsThisMonth > 0) {
    ticketGrowth = 100; // 100% growth if started from 0
  }

  // 3. Casos Abiertos
  const openCases = await prisma.case.count({
    where: {
      ...whereClause,
      status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] },
    },
  });

  // Crecimiento de Casos Abiertos (aprox vs mismo tiempo mes pasado - simplificado a conteo por ahora o comparación?)
  // Por simplicidad, manteniendo el crecimiento de casos abiertos igual al volumen de tickets o 0 por ahora como 'snapshot'.
  // Comparemos los casos abiertos creados este mes vs cerrados este mes para mostrar "flujo neto" tal vez?
  // O simplemente reusar el crecimiento del volumen total por ahora como proxy de actividad. Para ser precisos necesitaríamos snapshots históricos.
  // Usemos 0 para crecimiento de Casos Abiertos explícitamente a menos que implementemos snapshots.
  // Dejemos el crecimiento de Casos Abiertos como nulo o no calculado para esta iteración.

  // 4. Tiempo Promedio de Respuesta (Aproximación)
  // Miramos tickets creados en los últimos 30 días que tienen mensajes de NO-Cliente (asumiendo respuesta de soporte)
  // mejorar esta consulta es complejo en Prisma sin SQL crudo para "primera respuesta" estricta.
  // Haremos una revisión aproximada en los últimos 50 tickets.
  const recentTicketsWithMessages = await prisma.case.findMany({
    where: {
      ...whereClause,
      createdAt: { gte: subDays(now, 30) },
      messages: { some: {} }, // solo si tiene mensajes
    },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      messages: {
        select: {
          senderId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        take: 5,
      },
    },
    take: 50,
  });

  let totalResponseMinutes = 0;
  let answeredTicketsCount = 0;

  for (const ticket of recentTicketsWithMessages) {
    // Encontrar primer mensaje que NO sea del creador del ticket (y no nota interna si queremos respuesta 'pública', pero interno también cuenta)
    // Contemos cualquier mensaje no del creador como "respuesta"
    const firstResponse = ticket.messages.find(
      (m) => m.senderId !== ticket.userId
    );
    if (firstResponse) {
      const diffMs =
        firstResponse.createdAt.getTime() - ticket.createdAt.getTime();
      totalResponseMinutes += diffMs / (1000 * 60);
      answeredTicketsCount++;
    }
  }

  let avgResponseTimeMinutes = 0;
  if (answeredTicketsCount > 0) {
    avgResponseTimeMinutes = Math.round(
      totalResponseMinutes / answeredTicketsCount
    );
  }

  // 5. Salud del Sistema
  // Lógica: Si algún ticket CRÍTICO creado/actualizado en últimas 24h sigue ABIERTO/EN_PROGRESO -> Degradado
  const criticalIssues = await prisma.case.count({
    where: {
      priority: "CRITICAL",
      status: { in: ["OPEN", "IN_PROGRESS"] },
    },
  });

  let systemStatus = "operational"; // 'operational', 'degraded', 'down'
  if (criticalIssues > 0) {
    systemStatus = "degraded";
  }

  // 6. Satisfacción del Cliente (reusando lógica de página)
  const sentimentStats = await prisma.case.groupBy({
    by: ["sentiment"],
    _count: { id: true },
    where: whereClause,
  });

  const totalRated = sentimentStats.reduce(
    (acc, curr) => acc + curr._count.id,
    0
  );
  const nonNegative = sentimentStats
    .filter((s) => s.sentiment !== "NEGATIVE")
    .reduce((acc, curr) => acc + curr._count.id, 0);

  let satisfactionRate = 100;
  if (totalRated > 0) {
    satisfactionRate = Math.round((nonNegative / totalRated) * 100);
  }

  return {
    totalTickets,
    ticketGrowth,
    openCases,
    avgResponseTimeMinutes,
    satisfactionRate,
    systemStatus,
  };
}

export async function getDashboardStats(userId?: string, role?: string) {
  // Crear clave de caché basada en usuario y rol
  const cacheKey = `dashboard-stats-${userId || "all"}-${role || "client"}`;

  // Usar unstable_cache de Next.js para caché
  const getCachedStats = unstable_cache(
    async () => calculateDashboardStats(userId, role),
    [cacheKey],
    {
      revalidate: 300, // 5 minutes
      tags: ["dashboard-stats", `user-${userId || "all"}`],
    }
  );

  return getCachedStats();
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
