/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { TicketFilters } from "@/components/admin/ticket-filters";
import { TicketsWrapper } from "@/components/admin/tickets-wrapper";
import { TableLoadingOverlay } from "@/components/table-loading-overlay";
import { TicketsDataTable } from "@/components/admin/data-table/tickets-data-table";

// Force dynamic rendering for this page
export const dynamic = "force-dynamic";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    sort?: string;
    order?: string;
    department?: string;
    assignee?: string;
  }>;
}) {
  const t = await getTranslations("Admin");
  const session = await auth();
  const params = await searchParams;
  const query = params?.query || "";
  const page = Number(params?.page) || 1;
  const sort = params?.sort || "createdAt";
  const order = params?.order || "desc";
  const assigneeFilter = params?.assignee || "";
  const departmentFilter = params?.department || "";
  const limit = 10;
  const skip = (page - 1) * limit;

  // Fetch departments with their users for filter
  const departments = await prisma.department.findMany({
    include: {
      users: {
        where: {
          role: {
            in: [
              "MANAGER",
              "SERVICE_OFFICER",
              "TEAM_LEAD",
              "TECHNICAL_LEAD",
              "TECHNICIAN",
              "CONSULTANT",
              "DEVELOPER",
            ],
          },
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  let whereClause: any = {};

  // Filtro de búsqueda
  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { ticketNumber: { contains: query, mode: "insensitive" } },
      { user: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  // Filtro de asignado
  if (assigneeFilter) {
    if (assigneeFilter === "unassigned") {
      whereClause.assignedToId = null;
    } else {
      whereClause.assignedToId = assigneeFilter;
    }
  }

  // Filtro de departamento (por usuarios del departamento)
  if (departmentFilter) {
    const deptUsers =
      departments.find((d) => d.id === departmentFilter)?.users || [];
    const userIds = deptUsers.map((u) => u.id);
    if (userIds.length > 0) {
      whereClause.assignedToId = { in: userIds };
    } else {
      // Department has no users - return no results
      whereClause.assignedToId = "no-match-impossible-id";
    }
  }

  // Role restriction - ROOT, ADMIN, and MANAGER can see all tickets
  const fullAccessRoles = ["ROOT", "ADMIN", "MANAGER"];
  if (!fullAccessRoles.includes(session?.user?.role || "")) {
    // Fetch current user details to get departmentId
    const currentUser = await prisma.user.findUnique({
      where: { id: session?.user?.id },
      select: { id: true, role: true, departmentId: true },
    });

    if (currentUser?.role === "TEAM_LEAD" && currentUser.departmentId) {
      // TEAM_LEAD: See all tickets assigned to users in their department
      // Should they also see tickets they CREATED? Probably safest to keep that
      // OR logic if business allows, but strict requirement says "ver tickets de su departamento".
      // Let's assume they might personally handle tickets too.
      const leadFilter = {
        OR: [
          { userId: currentUser.id },
          { assignedTo: { departmentId: currentUser.departmentId } },
        ],
      };

      if (whereClause.OR) {
        whereClause = { AND: [whereClause, leadFilter] };
      } else {
        whereClause = { ...whereClause, ...leadFilter };
      }
    } else if (
      currentUser?.role === "TECHNICAL_LEAD" &&
      currentUser.departmentId
    ) {
      // TECHNICAL_LEAD: See their own tickets + tickets assigned to TECHNICIANS in their department
      const techLeadFilter = {
        OR: [
          { userId: currentUser.id }, // Created by me
          { assignedToId: currentUser.id }, // Assigned to me
          {
            assignedTo: {
              departmentId: currentUser.departmentId,
              role: "TECHNICIAN",
            },
          },
        ],
      };

      if (whereClause.OR) {
        whereClause = { AND: [whereClause, techLeadFilter] };
      } else {
        whereClause = { ...whereClause, ...techLeadFilter };
      }
    } else {
      // Default (Technician, etc): Only own tickets (created or assigned)
      const userFilter = {
        OR: [
          { userId: session?.user?.id },
          { assignedToId: session?.user?.id },
        ],
      };

      if (whereClause.OR) {
        whereClause = {
          AND: [whereClause, userFilter],
        };
      } else {
        whereClause = { ...whereClause, ...userFilter };
      }
    }
  }

  // Flatten users list for the bulk assign dropdown
  const allAssignableUsers = departments.flatMap((d) => d.users);

  // Build orderBy based on sort field
  let orderBy: any = { createdAt: "desc" };
  if (sort === "ticketNumber") orderBy = { ticketNumber: order };
  else if (sort === "title") orderBy = { title: order };
  else if (sort === "priority") orderBy = { priority: order };
  else if (sort === "status") orderBy = { status: order };
  else if (sort === "category") orderBy = { category: order };
  else if (sort === "assignedTo") orderBy = { assignedTo: { name: order } };
  else orderBy = { createdAt: order };

  const [tickets, totalCount] = await Promise.all([
    prisma.case.findMany({
      where: whereClause,
      include: {
        user: true,
        assignedTo: true,
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.case.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <TicketsWrapper>
      <Card x-chunk="dashboard-05-chunk-3">
        <CardHeader className="px-7">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>{t("tickets")}</CardTitle>
              <CardDescription>{t("ticketsDescription")}</CardDescription>
            </div>
            <TicketFilters departments={departments} />
          </div>
        </CardHeader>
        <CardContent>
          <TableLoadingOverlay>
            <TicketsDataTable
              tickets={tickets as any}
              totalCount={totalCount}
              totalPages={totalPages}
              currentPage={page}
              limit={limit}
              sort={sort}
              order={order}
              users={allAssignableUsers}
            />
          </TableLoadingOverlay>
        </CardContent>
      </Card>
    </TicketsWrapper>
  );
}
