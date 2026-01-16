import { Suspense } from "react";
import { getDepartments } from "@/actions/department-actions";
import { DepartmentList } from "@/components/admin/departments/department-list";
import { DepartmentForm } from "@/components/admin/departments/department-form";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getTranslations } from "next-intl/server";

export default async function DepartmentsPage() {
  const departments = await getDepartments();
  const t = await getTranslations("Admin.Departments");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <DepartmentForm />
      </div>
      <Separator />

      <Suspense
        fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin h-8 w-8" />
          </div>
        }
      >
        <DepartmentList departments={departments} />
      </Suspense>
    </div>
  );
}
