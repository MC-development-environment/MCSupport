"use client";

import { useState, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  reopenTicket,
  getDepartmentsWithUsers,
} from "@/common/actions/ticket-actions";
import { toast } from "sonner";
import { RefreshCcw, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { translateError } from "@/core/services/error-codes";

interface ReopenTicketDialogProps {
  ticketId: string;
  locale?: string;
}

interface Department {
  id: string;
  name: string;
  users: { id: string; name: string | null; email: string }[];
}

import { Textarea } from "@/components/ui/textarea";

// ... existing imports

export function ReopenTicketDialog({
  ticketId,
  locale = "es",
}: ReopenTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const tCommon = useTranslations("Common");

  const t = {
    reopen: locale === "es" ? "Reabrir Caso" : "Reopen Case",
    desc:
      locale === "es"
        ? "Seleccione departamento, usuario y motivo para reasignar"
        : "Select department, user and reason to reassign",
    selectDept:
      locale === "es" ? "Seleccionar departamento" : "Select department",
    selectUser: locale === "es" ? "Seleccionar usuario" : "Select user",
    reasonLabel: locale === "es" ? "Motivo de reapertura" : "Reopen Reason",
    reasonPlaceholder:
      locale === "es" ? "Escribe el motivo..." : "Enter reason...",
    confirm: locale === "es" ? "Reabrir" : "Reopen",
    success:
      locale === "es"
        ? "Caso reabierto exitosamente"
        : "Case reopened successfully",
    error:
      locale === "es" ? "Error al reabrir el caso" : "Failed to reopen case",
  };

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    const result = await getDepartmentsWithUsers();
    if (result.success && result.departments) {
      setDepartments(result.departments);
    }
    setLoading(false);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && departments.length === 0) {
      loadDepartments();
    }
    if (!isOpen) {
      setReason(""); // Reset reason on close
    }
  };

  const usersInDepartment =
    departments.find((d) => d.id === selectedDepartment)?.users || [];

  const handleReopen = () => {
    if (!selectedUser) return;
    if (!reason.trim()) {
      toast.error(
        locale === "es" ? "El motivo es requerido" : "Reason is required"
      );
      return;
    }

    startTransition(async () => {
      const result = await reopenTicket(ticketId, selectedUser, reason);
      if (result.success) {
        toast.success(t.success);
        setOpen(false);
      } else {
        toast.error(translateError(result.error, tCommon));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <RefreshCcw className="h-4 w-4" />
          {t.reopen}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.reopen}</DialogTitle>
          <DialogDescription>{t.desc}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t.selectDept}</label>
              <Select
                value={selectedDepartment}
                onValueChange={(val) => {
                  setSelectedDepartment(val);
                  setSelectedUser("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.selectDept} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDepartment && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t.selectUser}</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectUser} />
                  </SelectTrigger>
                  <SelectContent>
                    {usersInDepartment.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <label className="text-sm font-medium">{t.reasonLabel}</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.reasonPlaceholder}
                rows={3}
              />
            </div>

            <Button
              onClick={handleReopen}
              disabled={!selectedUser || !reason.trim() || isPending}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t.confirm}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
