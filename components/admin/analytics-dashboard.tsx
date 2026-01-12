"use client";

import { useState, useEffect, useTransition } from "react";
import { getAnalytics, AnalyticsPeriod } from "@/actions/analytics-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Loader2, CheckCircle2, AlertCircle, Ticket } from "lucide-react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import { CaseStatus } from "@prisma/client";

// Constantes de Paleta Premium
const COLORS = {
  OPEN: "#3b82f6", // Blue-500
  RESOLVED: "#10b981", // Emerald-500
  IN_PROGRESS: "#f59e0b", // Amber-500
  WAITING_CUSTOMER: "#64748b", // Slate-500
  CLOSED: "#8b5cf6", // Violet-500
  DEFAULT: "#94a3b8", // Slate-400
};

interface AnalyticsData {
  summary: {
    total: number;
    open: number;
    resolved: number;
    resolutionRate: number;
    slaCompliance: number;
    overdue: number;
    csat: number;
    surveyCount: number;
  };
  byStatus: { name: string; value: number }[];
  byPriority: { name: string; value: number }[];
  trend: { date: string; tickets: number; resolved: number }[];
  recent: {
    id: string;
    title: string;
    status: CaseStatus;
    createdAt: Date;
    user: {
      name: string | null;
      email: string;
    };
    assignedTo: {
      name: string | null;
      email: string;
    } | null;
  }[];
}

// Auxiliar para obtener color por clave de estado
const getChartColor = (status: string) => {
  switch (status) {
    case "OPEN":
      return COLORS.OPEN;
    case "RESOLVED":
      return COLORS.RESOLVED;
    case "IN_PROGRESS":
      return COLORS.IN_PROGRESS;
    case "WAITING_CUSTOMER":
      return COLORS.WAITING_CUSTOMER;
    case "CLOSED":
      return COLORS.CLOSED;
    default:
      return COLORS.DEFAULT;
  }
};

// Auxiliar para tickets recientes
const getStatusColor = (status: string) => {
  // Coincide con Paleta Premium en StatusBadge
  switch (status) {
    case "OPEN":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20 border whitespace-nowrap shrink-0";
    case "IN_PROGRESS":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20 border whitespace-nowrap shrink-0";
    case "WAITING_CUSTOMER":
      return "bg-gray-500/15 text-gray-500 border-gray-500/20 border whitespace-nowrap shrink-0";
    case "RESOLVED":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 border whitespace-nowrap shrink-0";
    case "CLOSED":
      return "bg-violet-500/10 text-violet-700 border-violet-500/20 border whitespace-nowrap shrink-0";
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-500/20 border whitespace-nowrap shrink-0";
  }
};

const getGradient = (type: string, value: number) => {
  switch (type) {
    case "total":
      return "bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-transparent";
    case "open":
      // Estado "Abierto" es Azul.
      return "bg-gradient-to-t from-blue-500/20 to-transparent dark:from-blue-950/30 dark:to-transparent";
    case "resolved":
      return "bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-transparent";
    case "trend":
      return "bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-transparent";
    case "overdue":
      // Siempre rojo para identificación de categoría Vencido
      return "bg-gradient-to-t from-red-500/20 to-transparent dark:from-red-950/30 dark:to-transparent";
    case "sla":
      // Verde si es alto, amarillo/rojo si es bajo
      if (value >= 90)
        return "bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-transparent";
      if (value >= 75)
        return "bg-gradient-to-t from-yellow-500/20 to-transparent dark:from-yellow-950/30 dark:to-transparent";
      return "bg-gradient-to-t from-red-500/20 to-transparent dark:from-red-950/30 dark:to-transparent";
    case "csat":
      if (value >= 4.5)
        return "bg-gradient-to-t from-emerald-500/20 to-transparent dark:from-emerald-950/30 dark:to-transparent";
      if (value >= 3.5)
        return "bg-gradient-to-t from-yellow-500/20 to-transparent dark:from-yellow-950/30 dark:to-transparent";
      return "bg-gradient-to-t from-red-500/20 to-transparent dark:from-red-950/30 dark:to-transparent";
    default:
      return "";
  }
};

interface AnalyticsDashboardProps {
  userId?: string;
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps = {}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isPending, startTransition] = useTransition();

  const t = useTranslations("Admin.Reports.Analytics");
  const tEnums = useTranslations("Enums");
  const locale = useLocale();
  const dateLocale = locale === "es" ? es : enUS;

  useEffect(() => {
    startTransition(async () => {
      const result = await getAnalytics(period, userId);
      if (!result.error) {
        setData(result as AnalyticsData);
      }
    });
  }, [period, userId]);

  if (!data && isPending) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const statusData = data.byStatus.map((item) => ({
    name: tEnums(`Status.${item.name}`),
    value: item.value,
    originalName: item.name,
    color: getChartColor(item.name),
  }));

  const priorityData = data.byPriority.map((item) => ({
    name: tEnums(`Priority.${item.name}`),
    value: item.value,
    originalName: item.name,
  }));

  return (
    <div className="space-y-4 relative">
      {/* Superposición de carga */}
      {isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg transition-all">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      <div
        className={`space-y-4 transition-opacity duration-300 ${
          isPending ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}
            className="w-full sm:w-auto"
          >
            <TabsList>
              <TabsTrigger value="7d">{t("tabs.7d")}</TabsTrigger>
              <TabsTrigger value="30d">{t("tabs.30d")}</TabsTrigger>
              <TabsTrigger value="90d">{t("tabs.90d")}</TabsTrigger>
              <TabsTrigger value="180d">{t("tabs.180d")}</TabsTrigger>
              <TabsTrigger value="365d">{t("tabs.365d")}</TabsTrigger>
              <TabsTrigger value="all">{t("tabs.all")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tarjetas KPI */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card className={getGradient("total", data?.summary.total || 0)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("totalTickets")}
              </CardTitle>
              <Ticket className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.total}</div>
              <p className="text-xs text-muted-foreground">{t("period")}</p>
            </CardContent>
          </Card>
          <Card className={getGradient("open", data?.summary.open || 0)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("openCases")}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.open}</div>
              <p className="text-xs text-muted-foreground">{t("attention")}</p>
            </CardContent>
          </Card>
          <Card
            className={getGradient("resolved", data?.summary.resolved || 0)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("resolved")}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.resolved}</div>
              <p className="text-xs text-muted-foreground">
                {data.summary.resolutionRate}% {t("resolutionRate")}
              </p>
            </CardContent>
          </Card>

          <Card
            className={getGradient("sla", data?.summary.slaCompliance || 0)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("slaCompliance") || "SLA Compliance"}
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.slaCompliance}%
              </div>
              <p className="text-xs text-muted-foreground">
                {t("target") || "Target"}: 90%
              </p>
            </CardContent>
          </Card>
          <Card className={getGradient("overdue", data?.summary.overdue || 0)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("overdue") || "Overdue"}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.overdue}</div>
              <p className="text-xs text-muted-foreground">
                {t("requiresAction") || "Requires Action"}
              </p>
            </CardContent>
          </Card>
          {/* CSAT Card */}
          <Card className={getGradient("csat", data?.summary.csat || 0)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("customerSat") || "CSAT"}
              </CardTitle>
              <div className="flex">
                {[1].map((_, i) => (
                  <svg
                    key={i}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 text-yellow-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clipRule="evenodd"
                    />
                  </svg>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.csat} / 5</div>
              <p className="text-xs text-muted-foreground">
                {data.summary.surveyCount} {t("ratings") || "Ratings"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-12 xl:grid-cols-7">
          {/* Gráfico de Tendencia */}
          <Card className="md:col-span-1 lg:col-span-7 xl:col-span-4">
            <CardHeader>
              <CardTitle>{t("volumeTitle")}</CardTitle>
              <CardDescription>{t("volumeDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend}>
                    <defs>
                      <linearGradient
                        id="colorTotal"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorResolved"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(str) =>
                        format(new Date(str), "d MMM", { locale: dateLocale })
                      }
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip
                      labelFormatter={(label) =>
                        format(new Date(label), "d MMMM yyyy", {
                          locale: dateLocale,
                        })
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="tickets"
                      name={t("createdChart")}
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      name={t("resolvedChart")}
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorResolved)"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1 lg:col-span-5 xl:col-span-3">
            <CardHeader>
              <CardTitle>{t("statusTitle")}</CardTitle>
              <CardDescription>{t("statusDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-12 xl:grid-cols-7">
          {/* Desglose de Prioridad */}
          <Card className="md:col-span-1 lg:col-span-5 xl:col-span-3">
            <CardHeader>
              <CardTitle>{t("priorityTitle")}</CardTitle>
              <CardDescription>{t("priorityDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priorityData}
                    layout="vertical"
                    margin={{ left: 40 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      fontSize={12}
                      width={100}
                    />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar
                      dataKey="value"
                      fill="#f97316"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Actividad Reciente */}
          <Card className="md:col-span-1 lg:col-span-7 xl:col-span-4">
            <CardHeader>
              <CardTitle>{t("recentTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recent.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center gap-2 border-b pb-2 last:border-0"
                  >
                    <div className="grid gap-1 flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {ticket.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ticket.user.email} •{" "}
                        {format(new Date(ticket.createdAt), "dd MMM HH:mm", {
                          locale: dateLocale,
                        })}
                      </p>
                    </div>
                    <div className="w-[100px] flex justify-center shrink-0">
                      <div
                        className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {tEnums(`Status.${ticket.status}`)}
                      </div>
                    </div>
                    <div className="w-[120px] text-xs text-muted-foreground text-right truncate shrink-0">
                      {ticket.assignedTo?.name ||
                        ticket.assignedTo?.email ||
                        "Sin asignar"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
