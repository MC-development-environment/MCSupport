"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FileDown, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { SendReportDialog } from "@/components/admin/send-report-dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

interface Employee {
  id: string;
  name: string | null;
  email: string;
}

interface ReportsClientProps {
  employees: Employee[];
}

export function ReportsClient({ employees }: ReportsClientProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const t = useTranslations("Admin.Reports");

  const periods = [
    { key: "daily", label: t("daily") },
    { key: "weekly", label: t("weekly") },
    { key: "monthly", label: t("monthly") },
    { key: "quarterly", label: t("quarterly") },
    { key: "semester", label: t("semester") },
    { key: "yearly", label: t("yearly") },
  ];

  const buildDownloadUrl = (period: string) => {
    let url = `/api/admin/reports?period=${period}`;

    // Si hay un rango de fecha personalizado, sobrescribir parámetros
    if (dateRange?.from && dateRange?.to) {
      url = `/api/admin/reports?startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`;
    }

    if (selectedEmployee && selectedEmployee !== "all") {
      url += `&userId=${selectedEmployee}`;
    }
    return url;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro de Fecha */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          {/* Filtro de empleado */}
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[220px]">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t("allEmployees")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allEmployees")}</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name || emp.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Send Report Dialog - Solo para usuarios técnicos */}
          <SendReportDialog />

          {/* Menú desplegable de exportación */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                {t("download")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("selectPeriod")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {periods.map((period) => (
                <DropdownMenuItem key={period.key} asChild>
                  <a
                    href={buildDownloadUrl(period.key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full cursor-pointer flex items-center"
                  >
                    {period.label} (CSV)
                  </a>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Panel Interactivo */}
      <AnalyticsDashboard
        userId={selectedEmployee === "all" ? undefined : selectedEmployee}
        customStartDate={dateRange?.from}
        customEndDate={dateRange?.to}
        hideFilters={true}
      />
    </div>
  );
}
