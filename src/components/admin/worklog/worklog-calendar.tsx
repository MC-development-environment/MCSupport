"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ActivityType, WorkLog } from "@prisma/client";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { es, enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/common/utils/utils";

// Colores por tipo de actividad
const ACTIVITY_DOT_COLORS: Record<ActivityType, string> = {
  TASK: "bg-blue-500",
  MEETING: "bg-purple-500",
  TRAINING: "bg-emerald-500",
  INTERNAL_CONSULT: "bg-orange-500",
  CLIENT_CONSULT: "bg-amber-500",
  PROJECT: "bg-cyan-500",
  SUPPORT: "bg-indigo-500",
  ADMINISTRATIVE: "bg-slate-500",
  BREAK: "bg-pink-500",
  OTHER: "bg-gray-500",
  DEVELOPMENT: "bg-teal-500",
  CONFERENCE: "bg-yellow-500",
};

interface WorkLogCalendarProps {
  workLogs: WorkLog[];
  onDayClick?: (date: Date) => void;
  onCreateClick?: (date: Date) => void;
}

export function WorkLogCalendar({
  workLogs,
  onDayClick,
  onCreateClick,
}: WorkLogCalendarProps) {
  const t = useTranslations("Admin.WorkLog");
  const tTypes = useTranslations("Admin.WorkLog.ActivityTypes");
  const locale = useLocale();
  const dateLocale = locale === "es" ? es : enUS;

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generar días del calendario (incluyendo días de meses adyacentes)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Agrupar logs por día
  const logsByDay = useMemo(() => {
    const grouped: Record<string, WorkLog[]> = {};

    workLogs.forEach((log) => {
      const dayKey = format(new Date(log.startTime), "yyyy-MM-dd");
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(log);
    });

    return grouped;
  }, [workLogs]);

  // Obtener tipos únicos de actividades para un día
  const getActivityTypesForDay = (date: Date): ActivityType[] => {
    const dayKey = format(date, "yyyy-MM-dd");
    const dayLogs = logsByDay[dayKey] || [];
    return [...new Set(dayLogs.map((log) => log.type))];
  };

  // Calcular horas totales de un día
  const getTotalHoursForDay = (date: Date): number => {
    const dayKey = format(date, "yyyy-MM-dd");
    const dayLogs = logsByDay[dayKey] || [];
    const totalMinutes = dayLogs.reduce(
      (acc, log) => acc + (log.duration || 0),
      0,
    );
    return Math.round((totalMinutes / 60) * 10) / 10;
  };

  const weekDays =
    locale === "es"
      ? ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t("calendar")}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium min-w-[140px] text-center capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {/* Encabezado de días de la semana */}
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del calendario */}
        <div className="grid grid-cols-7 gap-1">
          <TooltipProvider>
            {calendarDays.map((day) => {
              const activityTypes = getActivityTypesForDay(day);
              const totalHours = getTotalHoursForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const dayKey = format(day, "yyyy-MM-dd");
              const dayLogs = logsByDay[dayKey] || [];

              return (
                <Tooltip key={day.toISOString()}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onDayClick?.(day)}
                      className={cn(
                        "relative h-14 w-full rounded-md border transition-colors",
                        "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                        isToday(day) && "border-primary bg-primary/5",
                        !isCurrentMonth && "opacity-40",
                        activityTypes.length > 0 && "bg-accent/30",
                      )}
                    >
                      {/* Número del día */}
                      <span
                        className={cn(
                          "absolute top-1 left-2 text-sm font-medium",
                          isToday(day) && "text-primary font-bold",
                        )}
                      >
                        {format(day, "d")}
                      </span>

                      {/* Indicadores de actividad */}
                      {activityTypes.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 justify-center">
                          {activityTypes.slice(0, 4).map((type) => (
                            <span
                              key={type}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                ACTIVITY_DOT_COLORS[type],
                              )}
                            />
                          ))}
                          {activityTypes.length > 4 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{activityTypes.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Botón de añadir (hover) */}
                      {isCurrentMonth && onCreateClick && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateClick(day);
                          }}
                          className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100 p-0.5 rounded bg-primary/10 hover:bg-primary/20"
                        >
                          <Plus className="h-3 w-3 text-primary" />
                        </button>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    {dayLogs.length > 0 ? (
                      <div className="space-y-1">
                        <div className="font-medium">
                          {format(day, "dd MMMM", { locale: dateLocale })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {totalHours}h {t("total")}
                        </div>
                        <div className="space-y-0.5">
                          {dayLogs.slice(0, 3).map((log) => (
                            <div
                              key={log.id}
                              className="flex items-center gap-1.5 text-xs"
                            >
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  ACTIVITY_DOT_COLORS[log.type],
                                )}
                              />
                              <span className="truncate">{log.title}</span>
                            </div>
                          ))}
                          {dayLogs.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayLogs.length - 3} {t("more")}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        {format(day, "dd MMMM", { locale: dateLocale })}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {t("noActivities")}
                        </span>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Leyenda de colores */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(ACTIVITY_DOT_COLORS)
              .slice(0, 6)
              .map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className={cn("w-2.5 h-2.5 rounded-full", color)} />
                  <span className="text-muted-foreground">
                    {tTypes(type as ActivityType)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
