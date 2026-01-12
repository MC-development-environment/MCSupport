"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Palmtree,
  Loader2,
  Calendar as CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  activateVacationMode,
  deactivateVacationMode,
  getVacationStatus,
} from "@/actions/vacation-actions";
import { translateError } from "@/lib/error-codes";

interface VacationStatus {
  isOnVacation: boolean;
  startDate: Date | null;
  endDate: Date | null;
  message: string | null;
  activeTicketCount: number;
}

export function VacationToggle() {
  const t = useTranslations("Vacation");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<VacationStatus | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Formulario - Ahora usando Date objects
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [notifyClients, setNotifyClients] = useState(false);

  // Estados para controlar los Popovers
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  // Cargar estado inicial
  useEffect(() => {
    async function loadStatus() {
      try {
        const result = await getVacationStatus();
        if (result.success) {
          setStatus({
            isOnVacation: result.isOnVacation ?? false,
            startDate: result.startDate ?? null,
            endDate: result.endDate ?? null,
            message: result.message ?? null,
            activeTicketCount: result.activeTicketCount ?? 0,
          });
          // Si no está de vacaciones, inicializar fechas vacías
        } else {
          // Si es USER_NOT_FOUND probablemente es sesión inválida (re-seed), no spammear error rojo
          if (result.error !== "ERROR_USER_NOT_FOUND") {
            console.error("Failed to load vacation status:", result.error);
          }
          setStatus({
            isOnVacation: false,
            startDate: null,
            endDate: null,
            message: null,
            activeTicketCount: 0,
          });
        }
      } catch (error) {
        console.error("Error loading vacation status:", error);
        // Fallback state
        setStatus({
          isOnVacation: false,
          startDate: null,
          endDate: null,
          message: null,
          activeTicketCount: 0,
        });
      }
    }
    loadStatus();
  }, []);

  // Reset endDate if it becomes invalid relative to startDate
  // useEffect removed to avoid setState during render

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    if (date && endDate && endDate < date) {
      setEndDate(undefined);
    }
    setIsStartDateOpen(false); // Cerrar popover al seleccionar
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    setIsEndDateOpen(false); // Cerrar popover al seleccionar
  };

  const handleActivate = () => {
    if (!startDate || !endDate) {
      toast.error(t("errorActivating"));
      return;
    }
    // Validar rango
    if (endDate < startDate) {
      toast.error(tCommon("errors.invalidDateRange"));
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmActivation = () => {
    if (!startDate || !endDate) return;

    setShowConfirmDialog(false);
    startTransition(async () => {
      const result = await activateVacationMode({
        startDate: startDate,
        endDate: endDate,
        message: message || undefined,
        notifyClients,
      });

      if (result.success) {
        toast.success(t("activated", { count: result.reassignedCount ?? 0 }));
        // Recargar estado
        const newStatus = await getVacationStatus();
        if (newStatus.success) {
          setStatus({
            isOnVacation: newStatus.isOnVacation ?? true,
            startDate: newStatus.startDate ?? null,
            endDate: newStatus.endDate ?? null,
            message: newStatus.message ?? null,
            activeTicketCount: newStatus.activeTicketCount ?? 0,
          });
        }
      } else {
        toast.error(translateError(result.error, tCommon));
      }
    });
  };

  const handleDeactivate = () => {
    startTransition(async () => {
      const result = await deactivateVacationMode();
      if (result.success) {
        toast.success(t("deactivated"));
        setStatus({
          isOnVacation: false,
          startDate: null,
          endDate: null,
          message: null,
          activeTicketCount: status?.activeTicketCount ?? 0,
        });
        // Limpiar formulario
        setStartDate(undefined);
        setEndDate(undefined);
        setMessage("");
        setNotifyClients(false);
      } else {
        toast.error(translateError(result.error, tCommon));
      }
    });
  };

  if (!status) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Palmtree className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {t("title")}
                {status.isOnVacation && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    Activo
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{t("subtitle")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {status.isOnVacation ? (
            // Estado: Vacaciones activas
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="font-medium text-green-800 dark:text-green-300">
                  {t("currentlyOnVacation")}
                </p>
                {status.startDate && status.endDate && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {format(new Date(status.startDate), "PP", {
                      locale: locale === "es" ? es : enUS,
                    })}{" "}
                    {t("until")}{" "}
                    {format(new Date(status.endDate), "PP", {
                      locale: locale === "es" ? es : enUS,
                    })}
                  </p>
                )}
                {status.message && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    `{status.message}`
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={isPending}
                className="w-full"
              >
                {t("deactivate")}
              </Button>
            </div>
          ) : (
            // Estado: Formulario de activación
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 flex flex-col">
                  <Label>{t("startDate")}</Label>
                  <Popover
                    open={isStartDateOpen}
                    onOpenChange={setIsStartDateOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP", {
                            locale: locale === "es" ? es : enUS,
                          })
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={handleStartDateSelect}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        locale={locale === "es" ? es : enUS}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label>{t("endDate")}</Label>
                  <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PPP", {
                            locale: locale === "es" ? es : enUS,
                          })
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={handleEndDateSelect}
                        disabled={(date) =>
                          date <
                          (startDate ||
                            new Date(new Date().setHours(0, 0, 0, 0)))
                        }
                        locale={locale === "es" ? es : enUS}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("message")}</Label>
                <Textarea
                  id="message"
                  placeholder={t("messagePlaceholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyClients"
                  checked={notifyClients}
                  onCheckedChange={(checked) =>
                    setNotifyClients(checked === true)
                  }
                />
                <Label
                  htmlFor="notifyClients"
                  className="text-sm cursor-pointer"
                >
                  {t("notifyClients")}
                </Label>
              </div>

              {status.activeTicketCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {t("confirmMessage", { count: status.activeTicketCount })}
                </div>
              )}

              <Button
                onClick={handleActivate}
                disabled={isPending || !startDate || !endDate}
                className="w-full"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <CalendarIcon className="h-4 w-4 mr-2" />
                {t("activate")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmTitle")}</DialogTitle>
            <DialogDescription>
              {status.activeTicketCount > 0 ? (
                <>{t("confirmMessage", { count: status.activeTicketCount })}</>
              ) : (
                t("noTickets")
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button onClick={confirmActivation}>{t("activate")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
