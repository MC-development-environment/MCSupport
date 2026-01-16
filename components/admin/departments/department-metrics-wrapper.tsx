"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { DepartmentMetrics } from "./department-metrics";
import {
  getDepartmentMetrics,
  MetricsPeriod,
} from "@/actions/department-actions";
import { Loader2 } from "lucide-react";

interface MetricsData {
  totalTickets: number;
  resolvedCount: number;
  avgResolutionHours: number;
  avgSatisfaction: number;
  ticketsByStatus: { name: string; value: number }[];
  topPerformers: { name: string | null; resolved: number; avgTime: number }[];
  slaCompliance: number;
}

interface DepartmentMetricsWrapperProps {
  departmentId: string;
  initialData: MetricsData | null;
}

export function DepartmentMetricsWrapper({
  departmentId,
  initialData,
}: DepartmentMetricsWrapperProps) {
  const t = useTranslations("Admin.Departments.Metrics");
  const [period, setPeriod] = useState<MetricsPeriod>("all");
  const [metrics, setMetrics] = useState<MetricsData | null>(initialData);
  const [isPending, startTransition] = useTransition();

  const handlePeriodChange = (newPeriod: MetricsPeriod) => {
    setPeriod(newPeriod);
    startTransition(async () => {
      const newMetrics = await getDepartmentMetrics(departmentId, newPeriod);
      setMetrics(newMetrics);
    });
  };

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <div className="flex items-center gap-2">
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("selectPeriod")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t("periods.week")}</SelectItem>
              <SelectItem value="month">{t("periods.month")}</SelectItem>
              <SelectItem value="quarter">{t("periods.quarter")}</SelectItem>
              <SelectItem value="year">{t("periods.year")}</SelectItem>
              <SelectItem value="all">{t("periods.all")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Content */}
      {metrics ? (
        <DepartmentMetrics data={metrics} />
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {t("noData")}
        </div>
      )}
    </div>
  );
}
