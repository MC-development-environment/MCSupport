"use client";

import Link from "next/link";
import { Loader2, MoreHorizontal, Pencil, Trash, Users } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { deleteDepartment } from "@/common/actions/department-actions";
import { DepartmentForm } from "./department-form";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Department {
  id: string;
  name: string;
  _count: {
    users: number;
  };
}

interface DepartmentListProps {
  departments: Department[];
}

export function DepartmentList({ departments }: DepartmentListProps) {
  const t = useTranslations("Admin.Departments");
  const tNames = useTranslations("Admin.Departments.Names");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const router = useRouter();

  // Helper to translate department names
  const getDepartmentName = (name: string) => {
    if (tNames.has(name)) {
      return tNames(name);
    }
    return name; // Fallback to original name
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    startDelete(async () => {
      const result = await deleteDepartment(deleteId);
      if (result.success) {
        toast.success(t("Toast.deleted"));
        setDeleteId(null);
        router.refresh(); // Refresh list
      } else {
        toast.error(result.error);
      }
    });
  };

  if (departments.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/20">
        <Users className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{t("noDepartments")}</h3>
        <p className="text-muted-foreground mb-4">{t("noDepartmentsDesc")}</p>
        <DepartmentForm />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {getDepartmentName(dept.name)}
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DepartmentForm
                    initialData={dept}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Pencil className="mr-2 h-4 w-4" /> {t("edit")}
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuItem
                    className="text-red-600"
                    onSelect={() => setDeleteId(dept.id)}
                  >
                    <Trash className="mr-2 h-4 w-4" /> {t("delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dept._count.users}</div>
              <p className="text-xs text-muted-foreground">
                {t("activeUsers")}
              </p>
            </CardContent>
            <CardFooter className="pt-0">
              <Link
                href={`/admin/departments/${dept.id}`}
                className="text-sm text-primary hover:underline w-full text-right"
              >
                {t("viewPerformance")} &rarr;
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open: boolean) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
