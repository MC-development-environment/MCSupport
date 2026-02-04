"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reopenTicketByClient } from "@/common/actions/portal-ticket-actions";
import { toast } from "sonner";
import { RefreshCcw, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { translateError } from "@/core/services/error-codes";

interface ClientReopenTicketDialogProps {
  ticketId: string;
  locale?: string;
}

import { Textarea } from "@/components/ui/textarea";

// ...

export function ClientReopenTicketDialog({
  ticketId,
  locale = "es",
}: ClientReopenTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const tCommon = useTranslations("Common");

  const t = {
    reopen: locale === "es" ? "Reabrir Caso" : "Reopen Case",
    desc:
      locale === "es"
        ? "Por favor indique el motivo para reabrir este caso. El equipo de soporte será notificado."
        : "Please provide a reason for reopening this case. The support team will be notified.",
    reasonLabel: locale === "es" ? "Motivo" : "Reason",
    reasonPlaceholder:
      locale === "es"
        ? "Explica por qué necesitas reabrir el caso..."
        : "Explain why you need to reopen the case...",
    confirm: locale === "es" ? "Sí, reabrir" : "Yes, reopen",
    cancel: locale === "es" ? "Cancelar" : "Cancel",
    success:
      locale === "es"
        ? "Caso reabierto exitosamente"
        : "Case reopened successfully",
    error:
      locale === "es" ? "Error al reabrir el caso" : "Failed to reopen case",
  };

  const handleReopen = () => {
    if (!reason.trim()) {
      toast.error(
        locale === "es" ? "El motivo es requerido" : "Reason is required"
      );
      return;
    }

    startTransition(async () => {
      const result = await reopenTicketByClient(ticketId, reason);
      if (result.success) {
        toast.success(t.success);
        setOpen(false);
        setReason("");
      } else {
        toast.error(translateError(result.error, tCommon));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
        >
          <RefreshCcw className="h-4 w-4" />
          {t.reopen}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.reopen}</DialogTitle>
          <DialogDescription>{t.desc}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">{t.reasonLabel}</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.reasonPlaceholder}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {t.cancel}
          </Button>
          <Button onClick={handleReopen} disabled={!reason.trim() || isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t.confirm}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
