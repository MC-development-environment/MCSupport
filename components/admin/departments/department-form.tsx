"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createDepartment,
  updateDepartment,
  DepartmentFormData,
} from "@/actions/department-actions";

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

interface DepartmentFormProps {
  initialData?: { id: string; name: string };
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function DepartmentForm({
  initialData,
  trigger,
  onSuccess,
}: DepartmentFormProps) {
  const t = useTranslations("Admin.Departments");
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  async function onSubmit(data: DepartmentFormData) {
    setIsPending(true);
    try {
      let result;
      if (initialData) {
        result = await updateDepartment(initialData.id, data);
      } else {
        result = await createDepartment(data);
      }

      if (result.success) {
        toast.success(initialData ? t("Toast.updated") : t("Toast.created"));
        setOpen(false);
        form.reset();
        router.refresh();
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.error || t("Toast.error"));
      }
    } catch (error) {
      console.log(error);
      toast.error(t("Toast.error"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{t("create")}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {initialData
              ? t("edit") // Simplified description for edit, or add a specific key
              : t("subtitle")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? t("save") : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
