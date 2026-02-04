import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { WorkLogClient } from "@/components/admin/worklog/worklog-client";
import {
  getMyWorkLogs,
  getWorkLogStats,
  getActiveTimer,
} from "@/common/actions/worklog-actions";
import { Loader2 } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("Admin.WorkLog");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

async function WorkLogData() {
  const [logsResult, statsResult, timerResult] = await Promise.all([
    getMyWorkLogs(),
    getWorkLogStats("week"),
    getActiveTimer(),
  ]);

  // Extraer datos con manejo seguro de errores
  const workLogs = "workLogs" in logsResult ? logsResult.workLogs : [];
  const total = "total" in logsResult ? logsResult.total : 0;
  const stats =
    "error" in statsResult
      ? null
      : {
          period: statsResult.period,
          totalMinutes: statsResult.totalMinutes,
          totalHours: statsResult.totalHours,
          byType: statsResult.byType,
          entryCount: statsResult.entryCount,
          inProgress: statsResult.inProgress,
        };
  const activeTimer =
    "activeTimer" in timerResult ? timerResult.activeTimer : null;

  return (
    <WorkLogClient
      initialLogs={workLogs || []}
      initialStats={stats}
      initialTimer={activeTimer || null}
      totalLogs={total || 0}
    />
  );
}

export default async function WorkLogPage() {
  const t = await getTranslations("Admin.WorkLog");

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <WorkLogData />
      </Suspense>
    </div>
  );
}
