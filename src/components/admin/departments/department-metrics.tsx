"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Legend,
  ResponsiveContainer,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Star, TicketCheck, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface MetricsData {
  totalTickets: number;
  resolvedCount: number;
  avgResolutionHours: number;
  avgSatisfaction: number;
  ticketsByStatus: { name: string; value: number }[];
  topPerformers: { name: string | null; resolved: number; avgTime: number }[];
  slaCompliance: number;
}

// Helper para obtener el gradiente basado en el tipo y valor
const getGradient = (type: string, value: number) => {
  switch (type) {
    case "total":
      // Azul neutral para tickets totales
      return "bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-card";
    case "resolution":
      // Tiempo de resolución: Menor es mejor
      if (value === 0)
        return "bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-card";
      if (value <= 8)
        return "bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-card";
      if (value <= 24)
        return "bg-gradient-to-t from-amber-500/20 to-transparent dark:from-amber-950/30 dark:to-card";
      return "bg-gradient-to-t from-rose-500/20 to-transparent dark:from-rose-950/30 dark:to-card";
    case "csat":
      // Satisfacción: Mayor es mejor (escala 1-5)
      if (value === 0)
        return "bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-card";
      if (value >= 4)
        return "bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-card";
      if (value >= 3)
        return "bg-gradient-to-t from-amber-500/20 to-transparent dark:from-amber-950/30 dark:to-card";
      return "bg-gradient-to-t from-rose-500/20 to-transparent dark:from-rose-950/30 dark:to-card";
    case "rate":
      // Tasa de resolución: Mayor es mejor (porcentaje)
      if (value === 0)
        return "bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-card";
      if (value >= 80)
        return "bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-card";
      if (value >= 50)
        return "bg-gradient-to-t from-amber-500/20 to-transparent dark:from-amber-950/30 dark:to-card";
      return "bg-gradient-to-t from-rose-500/20 to-transparent dark:from-rose-950/30 dark:to-card";
    case "sla":
      // SLA Compliance: Mayor es mejor (porcentaje)
      if (value === 0 || value === 100)
        return "bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-card";
      if (value >= 90)
        return "bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-card";
      if (value >= 70)
        return "bg-gradient-to-t from-amber-500/20 to-transparent dark:from-amber-950/30 dark:to-card";
      return "bg-gradient-to-t from-rose-500/20 to-transparent dark:from-rose-950/30 dark:to-card";
    default:
      return "bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-card";
  }
};

// Helper para obtener el color del icono
const getIconColor = (type: string, value: number) => {
  switch (type) {
    case "total":
      return "text-blue-500";
    case "resolution":
      if (value === 0) return "text-blue-500";
      if (value <= 8) return "text-emerald-500";
      if (value <= 24) return "text-amber-500";
      return "text-rose-500";
    case "csat":
      if (value === 0) return "text-blue-500";
      if (value >= 4) return "text-emerald-500";
      if (value >= 3) return "text-amber-500";
      return "text-rose-500";
    case "rate":
      if (value === 0) return "text-blue-500";
      if (value >= 80) return "text-emerald-500";
      if (value >= 50) return "text-amber-500";
      return "text-rose-500";
    case "sla":
      if (value === 0 || value === 100) return "text-emerald-500";
      if (value >= 90) return "text-emerald-500";
      if (value >= 70) return "text-amber-500";
      return "text-rose-500";
    default:
      return "text-blue-500";
  }
};

export function DepartmentMetrics({ data }: { data: MetricsData }) {
  const t = useTranslations("Admin.Departments.Metrics");
  const COLORS = ["#0088FE", "#FFBB28", "#00C49F"];

  const resolutionRate =
    data.totalTickets > 0
      ? Math.round((data.resolvedCount / data.totalTickets) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className={getGradient("total", data.totalTickets)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalTickets")}
            </CardTitle>
            <TicketCheck
              className={`h-4 w-4 ${getIconColor("total", data.totalTickets)}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              {data.resolvedCount} {t("resolved")}
            </p>
          </CardContent>
        </Card>
        <Card className={getGradient("resolution", data.avgResolutionHours)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("avgResolution")}
            </CardTitle>
            <Clock
              className={`h-4 w-4 ${getIconColor(
                "resolution",
                data.avgResolutionHours
              )}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgResolutionHours}h</div>
            <p className="text-xs text-muted-foreground">{t("target")}</p>
          </CardContent>
        </Card>
        <Card className={getGradient("csat", data.avgSatisfaction)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("csat")}</CardTitle>
            <Star
              className={`h-4 w-4 ${getIconColor(
                "csat",
                data.avgSatisfaction
              )}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.avgSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground">
              {t("customerSatisfaction")}
            </p>
          </CardContent>
        </Card>
        <Card className={getGradient("rate", resolutionRate)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("resolutionRate")}
            </CardTitle>
            <TrendingUp
              className={`h-4 w-4 ${getIconColor("rate", resolutionRate)}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">{t("efficiency")}</p>
          </CardContent>
        </Card>
        <Card className={getGradient("sla", data.slaCompliance)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("slaCompliance")}
            </CardTitle>
            <Activity
              className={`h-4 w-4 ${getIconColor("sla", data.slaCompliance)}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.slaCompliance}%</div>
            <p className="text-xs text-muted-foreground">
              {t("slaDescription")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t("statusDist")}</CardTitle>
            <CardDescription>{t("workload")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data.ticketsByStatus.every((s) => s.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-6 mb-4">
                  <TicketCheck className="h-12 w-12 text-blue-500/50" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {t("noActivity")}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {t("emptyChartDesc")}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.ticketsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {data.ticketsByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t("topPerformers")}</CardTitle>
            <CardDescription>{t("mostResolved")}</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            {data.topPerformers.length === 0 ||
            data.topPerformers.every((p) => p.resolved === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-6 mb-4">
                  <TrendingUp className="h-12 w-12 text-emerald-500/50" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {t("noActivity")}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {t("emptyPerformersDesc")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.topPerformers
                  .filter((p) => p.resolved > 0)
                  .map((performer, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className="font-medium text-sm truncate"
                          title={performer.name || ""}
                        >
                          {performer.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("avgTime")}:{" "}
                          {Math.round(performer.avgTime * 10) / 10}h
                        </span>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {performer.resolved}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
