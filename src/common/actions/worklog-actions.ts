"use server";

import { auth } from "@/core/auth";
import { prisma } from "@/infrastructure/db/prisma";
import { ActivityType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInMinutes,
} from "date-fns";

// ==========================================
import { WorkLogStatus } from "@prisma/client";

// ==========================================
// TIPOS Y INTERFACES
// ==========================================

export interface CreateWorkLogInput {
  type: ActivityType;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // Manual duration in minutes
  status?: WorkLogStatus;
  progress?: number;
  projectName?: string;
  clientName?: string;
  ticketId?: string;
  tags?: string[];
}

export interface UpdateWorkLogInput extends Partial<CreateWorkLogInput> {
  id: string;
}

export interface WorkLogFilters {
  type?: ActivityType;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  project?: string;
  client?: string;
}

// Roles que pueden ver logs de otros usuarios
const SUPERVISOR_ROLES = [
  "ROOT",
  "ADMIN",
  "MANAGER",
  "TEAM_LEAD",
  "TECHNICAL_LEAD",
];

// Helper para determinar nivel de jerarquía (Mayor número = Mayor jerarquía)
function getRoleLevel(role: string | null | undefined): number {
  if (!role) return 0;
  const roleStr = role.toString();
  switch (roleStr) {
    case "ROOT":
      return 100;
    case "ADMIN":
      return 90;
    case "MANAGER":
      return 80;
    case "SERVICE_OFFICER":
      return 70;
    case "TEAM_LEAD":
      return 60;
    case "TECHNICAL_LEAD":
      return 50;
    case "CONSULTANT":
      return 40;
    case "DEVELOPER":
      return 30;
    case "TECHNICIAN":
      return 20;
    case "CLIENT":
      return 10;
    case "VIRTUAL_ASSISTANT":
      return 0;
    default:
      return 0;
  }
}

// ==========================================
// CREAR REGISTRO
// ==========================================

export async function createWorkLog(input: CreateWorkLogInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // Obtener información del usuario para el departamento
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true },
    });

    // Calcular duración y tiempos
    let duration = input.duration;
    let endTime = input.endTime;

    // Si se proporciona endTime, calculamos la duración exacta
    if (endTime && input.startTime) {
      duration = differenceInMinutes(endTime, input.startTime);
    }
    // Si no hay endTime pero sí duración manual, calculamos endTime
    else if (!endTime && duration) {
      endTime = new Date(input.startTime.getTime() + duration * 60 * 1000);
    }

    const workLog = await prisma.workLog.create({
      data: {
        userId: session.user.id,
        departmentId: user?.departmentId,
        type: input.type,
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: endTime,
        duration: duration,
        status: input.status || WorkLogStatus.OPEN,
        progress: input.progress || 0,
        projectName: input.projectName,
        clientName: input.clientName,
        ticketId: input.ticketId,
        tags: input.tags || [],
      },
    });

    revalidatePath("/admin/worklog");
    return { success: true, workLog };
  } catch (error) {
    console.error("Error creating work log:", error);
    return { error: "Failed to create work log" };
  }
}

// ==========================================
// ACTUALIZAR REGISTRO
// ==========================================

export async function updateWorkLog(input: UpdateWorkLogInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // Verificar propiedad y permisos
    const existing = await prisma.workLog.findUnique({
      where: { id: input.id },
      include: { user: { select: { id: true, role: true } } },
    });

    if (!existing) return { error: "Work log not found" };

    const isCreator = existing.userId === session.user.id;
    const userRoleLevel = getRoleLevel(session.user.role || "CLIENT");
    const creatorRoleLevel = getRoleLevel(existing.user.role || "CLIENT");
    const isSuperior = userRoleLevel > creatorRoleLevel;

    // Lógica de Permisos de Edición
    let dataToUpdate: Prisma.WorkLogUpdateInput = {};

    if (isCreator) {
      // El creador puede editar todo
      let duration = input.duration;
      let endTime = input.endTime;

      if (endTime && input.startTime) {
        duration = differenceInMinutes(endTime, input.startTime);
      } else if (!endTime && duration && input.startTime) {
        endTime = new Date(input.startTime.getTime() + duration * 60 * 1000);
      } else {
        // Si solo actualiza campos de texto, mantener tiempos existentes si no se pasaron
        duration = input.duration ?? (existing.duration || undefined);
        endTime = input.endTime ?? (existing.endTime || undefined);
      }

      dataToUpdate = {
        type: input.type,
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: endTime,
        duration: duration,
        status: input.status,
        progress: input.progress,
        projectName: input.projectName,
        clientName: input.clientName,
        ticket: input.ticketId
          ? { connect: { id: input.ticketId } }
          : undefined,
        tags: input.tags,
      };
    } else if (isSuperior) {
      // Supervisor: Solo título, detalles, porcentaje y estado
      dataToUpdate = {
        title: input.title,
        description: input.description,
        status: input.status,
        progress: input.progress,
        // No puede editar tiempos ni proyecto/cliente
      };
    } else {
      return {
        error: "Unauthorized - Insufficient privileges to edit this work log",
      };
    }

    const workLog = await prisma.workLog.update({
      where: { id: input.id },
      data: dataToUpdate,
    });

    revalidatePath("/admin/worklog");
    return { success: true, workLog };
  } catch (error) {
    console.error("Error updating work log:", error);
    return { error: "Failed to update work log" };
  }
}

// ==========================================
// ELIMINAR REGISTRO
// ==========================================

export async function deleteWorkLog(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const existing = await prisma.workLog.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) return { error: "Work log not found" };
    if (existing.userId !== session.user.id) return { error: "Unauthorized" };

    await prisma.workLog.delete({ where: { id } });

    revalidatePath("/admin/worklog");
    return { success: true };
  } catch (error) {
    console.error("Error deleting work log:", error);
    return { error: "Failed to delete work log" };
  }
}

// ==========================================
// OBTENER MIS REGISTROS
// ==========================================

export async function getMyWorkLogs(
  filters?: WorkLogFilters,
  page = 1,
  pageSize = 20,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const where: Prisma.WorkLogWhereInput = {
    userId: session.user.id,
  };

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.startDate || filters?.endDate) {
    where.startTime = {
      ...(filters.startDate && { gte: filters.startDate }),
      ...(filters.endDate && { lte: filters.endDate }),
    };
  }

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { projectName: { contains: filters.search, mode: "insensitive" } },
      { clientName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.project) {
    where.projectName = filters.project;
  }

  if (filters?.client) {
    where.clientName = filters.client;
  }

  try {
    const [workLogs, total] = await Promise.all([
      prisma.workLog.findMany({
        where,
        orderBy: { startTime: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          ticket: { select: { ticketNumber: true, title: true } },
        },
      }),
      prisma.workLog.count({ where }),
    ]);

    return {
      workLogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error fetching work logs:", error);
    return { error: "Failed to fetch work logs" };
  }
}

// ==========================================
// OBTENER LOGS DEL EQUIPO (SUPERVISORES)
// ==========================================

export async function getTeamWorkLogs(
  userId?: string,
  filters?: WorkLogFilters,
  page = 1,
  pageSize = 20,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Verificar rol de supervisor
  if (!session.user.role || !SUPERVISOR_ROLES.includes(session.user.role)) {
    return { error: "Unauthorized - Supervisor role required" };
  }

  const where: Prisma.WorkLogWhereInput = {};

  // ROOT/ADMIN/MANAGER ven todo, TEAM_LEAD/TECHNICAL_LEAD solo su departamento
  if (
    session.user.role === "TEAM_LEAD" ||
    session.user.role === "TECHNICAL_LEAD"
  ) {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true },
    });

    if (currentUser?.departmentId) {
      where.user = { departmentId: currentUser.departmentId };
    }
  }

  if (userId) {
    where.userId = userId;
  }

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.startDate || filters?.endDate) {
    where.startTime = {
      ...(filters.startDate && { gte: filters.startDate }),
      ...(filters.endDate && { lte: filters.endDate }),
    };
  }

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { projectName: { contains: filters.search, mode: "insensitive" } },
      { clientName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.project) {
    where.projectName = filters.project;
  }

  if (filters?.client) {
    where.clientName = filters.client;
  }

  try {
    const [workLogs, total] = await Promise.all([
      prisma.workLog.findMany({
        where,
        orderBy: { startTime: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, email: true } },
          ticket: { select: { ticketNumber: true, title: true } },
        },
      }),
      prisma.workLog.count({ where }),
    ]);

    return {
      workLogs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error fetching team work logs:", error);
    return { error: "Failed to fetch team work logs" };
  }
}

// ==========================================
// ESTADÍSTICAS PERSONALES
// ==========================================

export async function getWorkLogStats(
  period: "day" | "week" | "month" = "week",
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case "day":
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      break;
    case "week":
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "month":
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
  }

  try {
    const workLogs = await prisma.workLog.findMany({
      where: {
        userId: session.user.id,
        startTime: { gte: startDate, lte: endDate },
        endTime: { not: null },
      },
      select: {
        type: true,
        duration: true,
        startTime: true,
      },
    });

    // Total de minutos trabajados
    const totalMinutes = workLogs.reduce(
      (acc, log) => acc + (log.duration || 0),
      0,
    );

    // Agrupar por tipo de actividad
    const byType = workLogs.reduce(
      (acc, log) => {
        const type = log.type;
        if (!acc[type]) acc[type] = 0;
        acc[type] += log.duration || 0;
        return acc;
      },
      {} as Record<ActivityType, number>,
    );

    // Actividad en progreso
    const inProgress = await prisma.workLog.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
      orderBy: { startTime: "desc" },
    });

    return {
      period,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      byType: Object.entries(byType).map(([type, minutes]) => ({
        type: type as ActivityType,
        minutes,
        hours: Math.round((minutes / 60) * 10) / 10,
      })),
      entryCount: workLogs.length,
      inProgress,
    };
  } catch (error) {
    console.error("Error fetching work log stats:", error);
    return { error: "Failed to fetch stats" };
  }
}

// ==========================================
// INICIAR/DETENER CRONÓMETRO
// ==========================================

export async function startTimer(
  input: Omit<CreateWorkLogInput, "startTime" | "endTime">,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Verificar si hay un timer activo
  const activeTimer = await prisma.workLog.findFirst({
    where: {
      userId: session.user.id,
      endTime: null,
    },
  });

  if (activeTimer) {
    return { error: "Timer already running", activeTimer };
  }

  try {
    const workLog = await prisma.workLog.create({
      data: {
        userId: session.user.id,
        type: input.type,
        title: input.title,
        description: input.description,
        startTime: new Date(),
        projectName: input.projectName,
        clientName: input.clientName,
        ticketId: input.ticketId,
        tags: input.tags || [],
      },
    });

    revalidatePath("/admin/worklog");
    return { success: true, workLog };
  } catch (error) {
    console.error("Error starting timer:", error);
    return { error: "Failed to start timer" };
  }
}

export async function stopTimer(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const existing = await prisma.workLog.findUnique({
      where: { id },
      select: { userId: true, startTime: true, endTime: true },
    });

    if (!existing) return { error: "Work log not found" };
    if (existing.userId !== session.user.id) return { error: "Unauthorized" };
    if (existing.endTime) return { error: "Timer already stopped" };

    const endTime = new Date();
    const duration = differenceInMinutes(endTime, existing.startTime);

    const workLog = await prisma.workLog.update({
      where: { id },
      data: { endTime, duration },
    });

    revalidatePath("/admin/worklog");
    return { success: true, workLog };
  } catch (error) {
    console.error("Error stopping timer:", error);
    return { error: "Failed to stop timer" };
  }
}

// ==========================================
// OBTENER TIMER ACTIVO
// ==========================================

export async function getActiveTimer() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const activeTimer = await prisma.workLog.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
      orderBy: { startTime: "desc" },
    });

    return { activeTimer };
  } catch (error) {
    console.error("Error fetching active timer:", error);
    return { error: "Failed to fetch active timer" };
  }
}

// ==========================================
// OBTENER METADATA ÚNICA (PROYECTOS/CLIENTES)
// ==========================================

export async function getUniqueWorkLogMetadata() {
  const session = await auth();
  if (!session?.user?.id) return { projects: [], clients: [] };

  try {
    const [projects, clients] = await Promise.all([
      prisma.workLog.findMany({
        where: {
          userId: session.user.id,
          projectName: { not: null },
        },
        select: { projectName: true },
        distinct: ["projectName"],
        orderBy: { projectName: "asc" },
      }),
      prisma.workLog.findMany({
        where: {
          userId: session.user.id,
          clientName: { not: null },
        },
        select: { clientName: true },
        distinct: ["clientName"],
        orderBy: { clientName: "asc" },
      }),
    ]);

    return {
      projects: projects.map((p) => p.projectName).filter(Boolean) as string[],
      clients: clients.map((c) => c.clientName).filter(Boolean) as string[],
    };
  } catch (error) {
    console.error("Error fetching unique metadata:", error);
    return { projects: [], clients: [] };
  }
}
