import { ReportsClient } from "@/components/admin/reports-client";
import { prisma } from "@/infrastructure/db/prisma";
import { auth } from "@/core/auth";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  // Get employees based on role hierarchy
  let employees;
  const fullAccessRoles = ["ROOT", "ADMIN", "MANAGER"];

  if (fullAccessRoles.includes(session.user.role || "")) {
    // Manager sees all internal users
    employees = await prisma.user.findMany({
      where: {
        role: {
          in: ["TECHNICIAN", "TEAM_LEAD", "MANAGER"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  } else if (session.user.role === "TEAM_LEAD") {
    // Team Lead sees only their department
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true },
    });

    employees = await prisma.user.findMany({
      where: {
        departmentId: currentUser?.departmentId || undefined,
        role: {
          in: ["TECHNICIAN", "TEAM_LEAD"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  } else {
    // Technician sees only themselves
    employees = await prisma.user.findMany({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  return <ReportsClient employees={employees} />;
}
