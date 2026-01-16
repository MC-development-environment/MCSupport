"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type DepartmentFormData = z.infer<typeof departmentSchema>;

export async function getDepartments() {
  const session = await auth();
  if (!session) return [];

  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: { users: true },
      },
      users: {
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return departments;
}

export async function createDepartment(data: DepartmentFormData) {
  const session = await auth();
  const fullAccessRoles = ["ROOT", "ADMIN", "MANAGER"];
  if (!session || !fullAccessRoles.includes(session.user.role || "")) {
    // Assuming MANAGER/ADMIN role check
    return { error: "Unauthorized" };
  }

  const result = departmentSchema.safeParse(data);
  if (!result.success) {
    return { error: "Invalid data" };
  }

  try {
    await prisma.department.create({
      data: {
        name: result.data.name,
      },
    });
    revalidatePath("/admin/departments");
    return { success: true };
  } catch (error) {
    console.error("Error creating department:", error);
    return { error: "Failed to create department" };
  }
}

export async function updateDepartment(id: string, data: DepartmentFormData) {
  const session = await auth();
  const fullAccessRoles = ["ROOT", "ADMIN", "MANAGER"];
  if (!session || !fullAccessRoles.includes(session.user.role || "")) {
    return { error: "Unauthorized" };
  }

  const result = departmentSchema.safeParse(data);
  if (!result.success) {
    return { error: "Invalid data" };
  }

  try {
    await prisma.department.update({
      where: { id },
      data: {
        name: result.data.name,
      },
    });
    revalidatePath("/admin/departments");
    return { success: true };
  } catch (error) {
    console.error("Error updating department:", error);
    return { error: "Failed to update department" };
  }
}

export async function deleteDepartment(id: string) {
  const session = await auth();
  const fullAccessRoles = ["ROOT", "ADMIN", "MANAGER"];
  if (!session || !fullAccessRoles.includes(session.user.role || "")) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if department has users
    const department = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (department && department._count.users > 0) {
      return { error: "Cannot delete department with assigned users" };
    }

    await prisma.department.delete({
      where: { id },
    });
    revalidatePath("/admin/departments");
    return { success: true };
  } catch (error) {
    console.error("Error deleting department:", error);
    return { error: "Failed to delete department" };
  }
}

export type MetricsPeriod = "week" | "month" | "quarter" | "year" | "all";

// Helper to get date range based on period
function getDateRangeFromPeriod(period: MetricsPeriod): Date | undefined {
  const now = new Date();
  switch (period) {
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "quarter":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case "year":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case "all":
    default:
      return undefined;
  }
}

export async function getDepartmentMetrics(
  id: string,
  period: MetricsPeriod = "all"
) {
  const session = await auth();
  if (!session) return null;

  // 1. Get Department Users (excluding non-operational roles)
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      users: {
        where: {
          role: {
            notIn: ["MANAGER", "ADMIN", "ROOT", "VIRTUAL_ASSISTANT", "CLIENT"],
          },
        },
        select: { id: true, name: true, role: true },
      },
    },
  });

  if (!department) return null;

  const userIds = department.users.map((u) => u.id);

  if (userIds.length === 0) {
    return {
      totalTickets: 0,
      resolvedCount: 0,
      avgResolutionHours: 0,
      avgSatisfaction: 0,
      ticketsByStatus: [],
      topPerformers: [],
      slaCompliance: 0,
    };
  }

  // Get date range for filtering
  const dateFrom = getDateRangeFromPeriod(period);

  // 2. Get Tickets Assigned to these users (with date filter)
  const tickets = await prisma.case.findMany({
    where: {
      assignedToId: { in: userIds },
      ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      survey: {
        select: { rating: true },
      },
      assignedToId: true,
      slaTargetAt: true,
    },
  });

  // 3. Calculate Metrics
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((t) =>
    ["RESOLVED", "CLOSED"].includes(t.status)
  );

  // TTR Calculation (using createdAt vs updatedAt for RESOLVED/CLOSED tickets)
  // This is an estimation. ideally we use audit logs or a specific 'resolvedAt' field
  let totalResolutionHours = 0;
  resolvedTickets.forEach((t) => {
    const start = new Date(t.createdAt).getTime();
    const end = new Date(t.updatedAt).getTime();
    const hours = (end - start) / (1000 * 60 * 60);
    totalResolutionHours += hours;
  });
  const avgResolutionHours =
    resolvedTickets.length > 0
      ? totalResolutionHours / resolvedTickets.length
      : 0;

  // CSAT Calculation
  const ratedTickets = tickets.filter((t) => t.survey?.rating);
  const totalRating = ratedTickets.reduce(
    (acc, t) => acc + (t.survey?.rating || 0),
    0
  );
  const avgSatisfaction =
    ratedTickets.length > 0 ? totalRating / ratedTickets.length : 0;

  // SLA Compliance Calculation
  // We consider a ticket compliant if it was resolved before the SLA target
  const slaCompliantTickets = resolvedTickets.filter((t) => {
    if (!t.slaTargetAt) return true; // Assume compliant if no target set (legacy/undefined)
    return new Date(t.updatedAt) <= new Date(t.slaTargetAt);
  });

  const slaCompliance =
    resolvedTickets.length > 0
      ? (slaCompliantTickets.length / resolvedTickets.length) * 100
      : 100; // Default to 100% if no tickets to judge

  // Tickets by Status
  const ticketsByStatus = [
    { name: "Open", value: tickets.filter((t) => t.status === "OPEN").length },
    {
      name: "In Progress",
      value: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    },
    {
      name: "Resolved",
      value: tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status))
        .length,
    },
  ];

  // Top Performers (by resolved count)
  const performerMap = new Map<
    string,
    { name: string; resolved: number; avgTime: number }
  >();

  department.users.forEach((u) => {
    performerMap.set(u.id, {
      name: u.name || "Unknown",
      resolved: 0,
      avgTime: 0,
    });
  });

  tickets.forEach((t) => {
    if (t.assignedToId && ["RESOLVED", "CLOSED"].includes(t.status)) {
      const stats = performerMap.get(t.assignedToId);
      if (stats) {
        stats.resolved += 1;
        const start = new Date(t.createdAt).getTime();
        const end = new Date(t.updatedAt).getTime();
        const hours = (end - start) / (1000 * 60 * 60);
        // Store total time temporarily in avgTime to sum it up
        stats.avgTime += hours;
      }
    }
  });

  // Calculate avg for performers
  const topPerformers = Array.from(performerMap.values())
    .map((p) => ({
      name: p.name,
      resolved: p.resolved,
      avgTime: p.resolved > 0 ? p.avgTime / p.resolved : 0,
    }))
    .sort((a, b) => b.resolved - a.resolved)
    .slice(0, 5);

  return {
    totalTickets,
    resolvedCount: resolvedTickets.length,
    avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
    avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
    ticketsByStatus,
    topPerformers,
    slaCompliance: Math.round(slaCompliance * 10) / 10,
  };
}
