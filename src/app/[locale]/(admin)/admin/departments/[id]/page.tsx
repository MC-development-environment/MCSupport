import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/db/prisma";
import { getDepartmentMetrics } from "@/common/actions/department-actions";
import { DepartmentMetricsWrapper } from "@/components/admin/departments/department-metrics-wrapper";
import { TeamMembersList } from "@/components/admin/departments/team-members-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/common/i18n/routing";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function DepartmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Admin.Departments.Metrics");

  const tNames = await getTranslations("Admin.Departments.Names");

  // Get translated department name
  const getDepartmentName = (name: string) => {
    if (tNames.has(name)) {
      return tNames(name);
    }
    return name;
  };

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  if (!department) {
    notFound();
  }

  // Get initial metrics (all time)
  const initialMetrics = await getDepartmentMetrics(id, "all");

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header con botón de regreso */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link href="/admin/departments">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getDepartmentName(department.name)}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      {/* Metrics with Period Selector */}
      <DepartmentMetricsWrapper
        departmentId={id}
        initialData={initialMetrics}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {t("teamMembers")} ({department.users.length})
          </CardTitle>
          <CardDescription>{t("teamMembersDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMembersList users={department.users} />
        </CardContent>
      </Card>
    </div>
  );
}
