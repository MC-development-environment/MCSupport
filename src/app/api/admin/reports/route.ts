import { auth } from "@/core/auth";
import { prisma } from "@/infrastructure/db/prisma";
import { Prisma } from "@prisma/client";
import {
  startOfDay,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  format,
} from "date-fns";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();

  // Permissions: ROOT, ADMIN, MANAGER and TEAM_LEAD can download reports
  const fullAccessRoles = ["ROOT", "ADMIN", "MANAGER", "TEAM_LEAD"];
  if (
    !session?.user?.id ||
    !fullAccessRoles.includes(session.user.role || "")
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "daily";
  const userId = searchParams.get("userId");

  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  let startDate = new Date();
  let endDate = new Date();

  // If custom dates are provided, use them
  if (startDateParam && endDateParam) {
    startDate = startOfDay(new Date(startDateParam));
    endDate = new Date(endDateParam);
    // Set end date to end of day to include full day
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Only apply period logic if no custom dates
    switch (period) {
      case "daily":
        startDate = startOfDay(new Date());
        break;
      case "weekly":
        startDate = subWeeks(new Date(), 1);
        break;
      case "monthly":
        startDate = subMonths(new Date(), 1);
        break;
      case "quarterly":
        startDate = subMonths(new Date(), 3);
        break;
      case "semester":
        startDate = subMonths(new Date(), 6);
        break;
      case "yearly":
        startDate = subYears(new Date(), 1);
        break;
      default:
        startDate = subDays(new Date(), 1);
    }
  }

  // Filter by department if Team Lead?
  // "Líder: Asigna a su departamento". Implies report scope too?
  // User requested "reportes diarios...". Assuming global for Manager, Dept for Lead.
  // I will implement scoped query logic.
  let whereClause: Prisma.CaseWhereInput = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  // Filter by employee if userId provided
  if (userId) {
    // TECHNICIAN can only view their own data
    if (
      session.user.role &&
      (session.user.role as string) === "TECHNICIAN" &&
      userId !== session.user.id
    ) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // TEAM_LEAD can only view users in their department
    if (session.user.role === "TEAM_LEAD") {
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { departmentId: true },
      });
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true },
      });
      if (currentUser?.departmentId !== targetUser?.departmentId) {
        return new NextResponse("Unauthorized", { status: 403 });
      }
    }

    whereClause.assignedToId = userId;
  }

  if (session.user.role === "TEAM_LEAD") {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (currentUser?.departmentId) {
      // Tickets assigned to department members OR reported by department members?
      // Usually "Work done by department". So assignedTo user in department.
      whereClause = {
        ...whereClause,
        assignedTo: {
          departmentId: currentUser.departmentId,
        },
      };
    }
  }

  const tickets = await prisma.case.findMany({
    where: whereClause,
    include: {
      user: true,
      assignedTo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Generate CSV
  const headers = [
    "Ticket ID",
    "Title",
    "Status",
    "Priority",
    "Customer",
    "Assigned To",
    "Created At",
    "Updated At",
  ];
  const rows = tickets.map((t) => [
    t.ticketNumber,
    `"${t.title.replace(/"/g, '""')}"`, // Escape quotes
    t.status,
    t.priority,
    t.user.email,
    t.assignedTo?.email || "Unassigned",
    format(t.createdAt, "yyyy-MM-dd HH:mm:ss"),
    format(t.updatedAt, "yyyy-MM-dd HH:mm:ss"),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((r: string[]) => r.join(",")),
  ].join("\n");

  // Add UTF-8 BOM (Byte Order Mark) for proper encoding in Excel
  const utf8BOM = "\uFEFF";
  const csvWithBOM = utf8BOM + csvContent;

  // Build filename with employee name if filtered
  let filename = `report-${period}-${format(new Date(), "yyyyMMdd")}`;
  if (startDateParam && endDateParam) {
    filename = `report-custom-${format(startDate, "yyyyMMdd")}-${format(
      endDate,
      "yyyyMMdd",
    )}`;
  }
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    if (user) {
      const userName = (user.name || user.email).replace(/[^a-zA-Z0-9]/g, "_");
      filename = `report-${period}-${userName}-${format(
        new Date(),
        "yyyyMMdd",
      )}`;
    }
  }

  return new NextResponse(csvWithBOM, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
