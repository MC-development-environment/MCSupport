"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import {
  useCallback,
  useState,
  useEffect,
  useTransition,
  useMemo,
} from "react";
import { useSession } from "next-auth/react";
import { format, isToday } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { ActivityType, WorkLog, WorkLogStatus } from "@prisma/client";
import {
  createWorkLog,
  updateWorkLog,
  deleteWorkLog,
  getMyWorkLogs,
  getWorkLogStats,
  startTimer,
  stopTimer,
  getActiveTimer,
  getUniqueWorkLogMetadata,
  CreateWorkLogInput,
  UpdateWorkLogInput,
} from "@/common/actions/worklog-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Square,
  Plus,
  Clock,
  Briefcase,
  Laptop,
  MessageSquare,
  FileText,
  User,
  Coffee,
  MoreHorizontal,
  ListTodo,
  AlertCircle,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/common/utils/utils";
import { Combobox } from "@/components/ui/combobox";
import { Slider } from "@/components/ui/slider";

// Iconos para tipos de actividad
const ACTIVITY_ICONS: Record<ActivityType, React.ElementType> = {
  TASK: ListTodo,
  MEETING: User,
  TRAINING: Laptop,
  INTERNAL_CONSULT: MessageSquare,
  CLIENT_CONSULT: Briefcase,
  PROJECT: Briefcase,
  SUPPORT: Laptop,
  DEVELOPMENT: Laptop,
  CONFERENCE: User,
  ADMINISTRATIVE: FileText,
  BREAK: Coffee,
  OTHER: MoreHorizontal,
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  TASK: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  MEETING:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  TRAINING:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  INTERNAL_CONSULT:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  CLIENT_CONSULT:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  PROJECT: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  SUPPORT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  DEVELOPMENT:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  CONFERENCE:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  ADMINISTRATIVE:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  BREAK: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  OTHER: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

interface WorkLogStats {
  period: string;
  totalMinutes: number;
  totalHours: number;
  byType: { type: ActivityType; minutes: number; hours: number }[];
  entryCount: number;
  inProgress?: WorkLog | null;
}

interface ActivityFormData {
  mode: "timer" | "manual";
  type: ActivityType;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: WorkLogStatus;
  progress: number;
  projectName?: string;
  clientName?: string;
}

interface WorkLogClientProps {
  initialLogs: WorkLog[];
  initialStats: WorkLogStats | null;
  initialTimer: WorkLog | null;
  totalLogs: number;
}

export function WorkLogClient({
  initialLogs,
  initialStats,
  initialTimer,
}: WorkLogClientProps) {
  const t = useTranslations("Admin.WorkLog");
  const tTypes = useTranslations("Enums.ActivityType");
  const { data: session } = useSession();
  const locale = useLocale();
  const dateLocale = locale === "es" ? es : enUS;

  // Estados
  const [logs, setLogs] = useState<WorkLog[]>(initialLogs);
  const [activeTimer, setActiveTimer] = useState<WorkLog | null>(initialTimer);
  const [stats, setStats] = useState<WorkLogStats>(
    initialStats || {
      period: "week",
      totalHours: 0,
      byType: [],
      totalMinutes: 0,
      entryCount: 0,
    },
  );
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);

  // Metadata for autocomplete
  const [projects, setProjects] = useState<string[]>([]);
  const [clients, setClients] = useState<string[]>([]);

  // const [isPending, startTransition] = useTransition();
  const [, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    startTransition(async () => {
      const [logsData, activeData, statsData] = await Promise.all([
        getMyWorkLogs({}, 1, 50),
        getActiveTimer(),
        getWorkLogStats("week"),
      ]);

      if (logsData.workLogs) setLogs(logsData.workLogs);
      if (activeData.activeTimer) setActiveTimer(activeData.activeTimer);
      if (statsData && "totalHours" in statsData)
        setStats(statsData as WorkLogStats);
    });
  }, []);

  // Load metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      const data = await getUniqueWorkLogMetadata();
      if (data) {
        setProjects(data.projects);
        setClients(data.clients);
      }
    };
    fetchMetadata();
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // Refrescar cada minuto
    return () => clearInterval(interval);
  }, [loadData]);

  // Actualizar segundos del timer activo
  useEffect(() => {
    if (!activeTimer) {
      if (timerSeconds !== 0) setTimerSeconds(0);
      return;
    }

    const startTime = new Date(activeTimer.startTime).getTime();
    const updateTimer = () => {
      const now = Date.now();
      setTimerSeconds(Math.floor((now - startTime) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeTimer, timerSeconds]);

  const handleStartTimer = async (data: ActivityFormData) => {
    // Si es una entrada manual (mode === 'manual'), usamos createWorkLog
    // Si es timer (mode === 'timer'), usamos startTimer

    if (data.mode === "manual") {
      const input: CreateWorkLogInput = {
        type: data.type,
        title: data.title,
        description: data.description,
        startTime: data.startTime || new Date(),
        duration: data.duration,
        status: data.status,
        progress: data.progress,
        projectName: data.projectName,
        clientName: data.clientName,
      };

      const res = await createWorkLog(input);
      if (res.error) {
        toast.error("Error creating entry");
      } else {
        toast.success("Entry created");
        setIsDialogOpen(false);
        loadData();
      }
    } else {
      const res = await startTimer({
        type: data.type,
        title: data.title,
        description: data.description,
        projectName: data.projectName,
        clientName: data.clientName,
      });

      if (res.error) {
        toast.error("Error starting timer");
      } else {
        toast.success("Timer started");
        setIsDialogOpen(false);
        loadData();
      }
    }
  };

  const handleStopTimer = async (id?: string) => {
    const targetId = id || activeTimer?.id;
    if (!targetId) return;

    const res = await stopTimer(targetId);
    if (res.error) {
      toast.error("Error stopping timer");
    } else {
      toast.success("Timer stopped");
      setActiveTimer(null);
      loadData();
    }
  };

  const handleUpdateLog = async (data: ActivityFormData) => {
    if (!selectedLog) return;

    const input: UpdateWorkLogInput = {
      id: selectedLog.id,
      title: data.title,
      description: data.description,
      type: data.type,
      startTime: data.startTime,
      duration: data.duration,
      status: data.status,
      progress: data.progress,
      projectName: data.projectName,
      clientName: data.clientName,
    };

    const res = await updateWorkLog(input);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Activity updated");
      setIsEditOpen(false);
      setSelectedLog(null);
      loadData();
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await deleteWorkLog(id);
    if (res.error) {
      toast.error("Error deleting activity");
    } else {
      toast.success("Activity deleted");
      loadData();
    }
  };

  const openEditDialog = (log: WorkLog) => {
    setSelectedLog(log);
    setIsEditOpen(true);
  };

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return "-";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Notificación de recordatorio (si no hay actividad hoy)
  const showReminder = useMemo(() => {
    if (activeTimer) return false;
    const hasActivityToday = logs.some((log) =>
      isToday(new Date(log.startTime)),
    );
    return !hasActivityToday;
  }, [logs, activeTimer]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {activeTimer && (
            <Button
              variant="destructive"
              className="gap-2 animate-pulse"
              onClick={() => handleStopTimer()}
            >
              <Square className="h-4 w-4 fill-current" />
              Stop ({formatDuration(activeTimer.duration)})
            </Button>
          )}
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("newActivity")}
          </Button>
        </div>
      </div>

      {/* Notificación de recordatorio */}
      {showReminder && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center gap-3 text-yellow-700 animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 text-sm font-medium">
            {t("noActivityReminder")}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-700"
            onClick={() => setIsDialogOpen(true)}
          >
            {t("startActivity")}
          </Button>
        </div>
      )}

      {/* Timer + Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Timer Card */}
        <Card
          className={cn(
            "md:col-span-2 transition-all duration-300",
            activeTimer
              ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-lg shadow-primary/5 ring-1 ring-primary/20"
              : "bg-card",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock
                className={cn(
                  "h-5 w-5",
                  activeTimer && "text-primary animate-pulse",
                )}
              />
              {t("timer")}
              {activeTimer && (
                <span className="flex h-2 w-2 ml-auto">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTimer ? (
              <div className="space-y-4">
                <div className="text-4xl font-mono font-bold text-primary tabular-nums tracking-tight">
                  {formatTimer(timerSeconds)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge
                    className={cn(
                      ACTIVITY_COLORS[activeTimer.type],
                      "animate-in fade-in zoom-in duration-300",
                    )}
                  >
                    {tTypes(activeTimer.type)}
                  </Badge>
                  <span className="truncate">{activeTimer.title}</span>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => handleStopTimer()}
                  className="w-full shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <Square className="h-4 w-4 mr-2 fill-current" />
                  {t("stopTimer")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-4xl font-mono font-bold text-muted-foreground/30 tabular-nums">
                  00:00:00
                </div>
                <Button
                  className="w-full shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Play className="h-4 w-4 mr-2 fill-current" />
                  {t("startTimer")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("todayHours")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHours || 0}h</div>
            <p className="text-xs text-muted-foreground">
              {stats?.entryCount || 0} {t("entries")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("weekHours")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHours || 0}h</div>
            <p className="text-xs text-muted-foreground">{t("thisWeek")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart */}
      {stats?.byType && stats.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("distribution")}</CardTitle>
            <CardDescription>{t("distributionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stats.byType.map((item) => {
                const Icon = ACTIVITY_ICONS[item.type];
                const totalMinutes = item.minutes;
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;

                return (
                  <div
                    key={item.type}
                    className="flex flex-col gap-2 p-4 rounded-xl border bg-card/50 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          ACTIVITY_COLORS[item.type],
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="font-medium text-sm text-foreground/80">
                        {tTypes(item.type)}
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="text-xl font-bold tracking-tight">
                        {hours > 0 ? (
                          <span>
                            {hours}
                            <span className="text-sm font-normal text-muted-foreground">
                              h
                            </span>{" "}
                            {minutes > 0 && (
                              <span>
                                {minutes}
                                <span className="text-sm font-normal text-muted-foreground">
                                  m
                                </span>
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>
                            {minutes}
                            <span className="text-sm font-normal text-muted-foreground">
                              m
                            </span>
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full bg-muted mt-2 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full opacity-60",
                            ACTIVITY_COLORS[item.type as ActivityType]?.split(
                              " ",
                            )[0],
                          )}
                          style={{
                            width: `${Math.min(100, (item.minutes / stats.totalMinutes) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentActivities")}</CardTitle>
          <CardDescription>
            Review and manage your recent work logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => {
              const Icon =
                ACTIVITY_ICONS[log.type as ActivityType] || MoreHorizontal;
              return (
                <div
                  key={log.id}
                  className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border hover:bg-accent/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
                  onClick={() => openEditDialog(log)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-2.5 rounded-xl ${ACTIVITY_COLORS[log.type as ActivityType]} group-hover:scale-105 transition-transform duration-200 shrink-0`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base truncate">
                          {log.title}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs font-normal bg-background/50"
                        >
                          {tTypes(log.type)}
                        </Badge>
                        <Badge
                          variant={
                            log.status === "COMPLETED" || !log.status
                              ? "secondary"
                              : "default"
                          }
                          className="text-[10px] h-5"
                        >
                          {log.status || "COMPLETED"}
                        </Badge>
                      </div>

                      {log.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl leading-relaxed">
                          {log.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 pt-1">
                        {log.projectName && (
                          <div className="flex items-center gap-1.5 bg-accent/50 px-2 py-0.5 rounded-full">
                            <Briefcase className="h-3 w-3" />
                            <span>{log.projectName}</span>
                          </div>
                        )}
                        {log.clientName && (
                          <div className="flex items-center gap-1.5 bg-accent/50 px-2 py-0.5 rounded-full">
                            <User className="h-3 w-3" />
                            <span>{log.clientName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-x-6 gap-y-1 sm:min-w-[120px] text-right ml-14 sm:ml-0 border-t sm:border-0 pt-3 sm:pt-0 mt-2 sm:mt-0">
                    <div className="text-xl font-bold font-mono tracking-tight tabular-nums">
                      {formatDuration(log.duration)}
                    </div>
                    <div className="flex flex-col items-end text-xs text-muted-foreground">
                      <span>
                        {format(new Date(log.startTime), "MMM d", {
                          locale: dateLocale,
                        })}
                      </span>
                      <span className="opacity-60">
                        {format(new Date(log.startTime), "h:mm a")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Dialog (Single Instance) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t("newActivity")}</DialogTitle>
            <DialogDescription>{t("newActivityDesc")}</DialogDescription>
          </DialogHeader>
          <ActivityForm
            onSubmit={handleStartTimer}
            onCancel={() => setIsDialogOpen(false)}
            projects={projects}
            clients={clients}
            currentUser={session?.user}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <ActivityForm
              initialData={selectedLog}
              onSubmit={handleUpdateLog}
              onCancel={() => setIsEditOpen(false)}
              projects={projects}
              clients={clients}
              isEdit
              currentUser={session?.user}
              onDelete={() => handleDeleteLog(selectedLog.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// FORMULARIO ACTIVITY (MANUAL & TIMER)
// ==========================================

function ActivityForm({
  onSubmit,
  onCancel,
  initialData,
  projects = [],
  clients = [],
  isEdit = false,
  currentUser,
  onDelete,
}: {
  onSubmit: (data: ActivityFormData) => void;
  onCancel: () => void;
  initialData?: WorkLog;
  projects?: string[];
  clients?: string[];
  isEdit?: boolean;
  currentUser?: { id: string; role?: string | null };
  onDelete?: () => void;
}) {
  const t = useTranslations("Admin.WorkLog");
  const tTypes = useTranslations("Enums.ActivityType");
  const getRoleLevel = (role: string | null | undefined) => {
    if (!role) return 10;
    const roleStr = role.toString();
    switch (roleStr) {
      case "ROOT":
        return 100;
      case "ADMIN":
        return 90;
      case "MANAGER":
        return 80;
      case "TEAM_LEAD":
        return 60;
      case "TECHNICAL_LEAD":
        return 50;
      case "CONSULTANT":
        return 40;
      case "DEVELOPER":
        return 30;
      case "TECHNICIAN":
        return 20;
      case "CLIENT":
        return 10;
      case "VIRTUAL_ASSISTANT":
        return 0;
      default:
        return 10;
    }
  };

  const isCreator = !initialData || initialData.userId === currentUser?.id;
  const isSuperior =
    !isCreator &&
    getRoleLevel(currentUser?.role || "CLIENT") > getRoleLevel("CLIENT");

  const canEditDetails = isCreator || isSuperior;
  const canEditTimes = isCreator && !isSuperior;

  const [tab, setTab] = useState(!isEdit ? "timer" : "manual");

  const [type, setType] = useState<ActivityType>(initialData?.type || "TASK");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [projectName, setProjectName] = useState(
    initialData?.projectName || "",
  );
  const [clientName, setClientName] = useState(initialData?.clientName || "");

  const [startDate, setStartDate] = useState(
    initialData?.startTime
      ? format(new Date(initialData.startTime), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd"),
  );
  const [startTime, setStartTime] = useState(
    initialData?.startTime
      ? format(new Date(initialData.startTime), "HH:mm")
      : format(new Date(), "HH:mm"),
  );
  const [duration, setDuration] = useState(
    initialData?.duration?.toString() || "",
  );

  const [status, setStatus] = useState<WorkLogStatus>(
    initialData?.status || ("OPEN" as WorkLogStatus),
  );
  const [progress, setProgress] = useState(initialData?.progress || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = new Date(`${startDate}T${startTime}`);

    const params: ActivityFormData = {
      mode: tab as "timer" | "manual",
      type,
      title,
      description,
      projectName,
      clientName,
      startTime: startDateTime,
      duration: duration ? parseInt(duration) : undefined,
      status,
      progress,
    };

    onSubmit(params);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timer" className="gap-2">
              <Timer className="h-4 w-4" />
              Timer Mode
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>
          <div className="my-4 border-b"></div>
        </Tabs>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("type")}</Label>
          <Select
            value={type}
            onValueChange={(val) => setType(val as ActivityType)}
            disabled={!canEditTimes && isEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(ACTIVITY_ICONS).map((type) => (
                <SelectItem key={type} value={type}>
                  {tTypes(type as ActivityType)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(tab === "manual" || isEdit) && (
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as WorkLogStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("title")}</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          required
          disabled={!canEditDetails && isEdit}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("description")}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descPlaceholder")}
          rows={3}
          disabled={!canEditDetails && isEdit}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("project")}</Label>
          <Combobox
            options={projects}
            value={projectName}
            onValueChange={setProjectName}
            placeholder={t("projectPlaceholder")}
            allowCustom
            className={
              !canEditTimes && isEdit ? "opacity-50 pointer-events-none" : ""
            }
            disabled={!canEditTimes && isEdit}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("client")}</Label>
          <Combobox
            options={clients}
            value={clientName}
            onValueChange={setClientName}
            placeholder={t("clientPlaceholder")}
            allowCustom
            className={
              !canEditTimes && isEdit ? "opacity-50 pointer-events-none" : ""
            }
            disabled={!canEditTimes && isEdit}
          />
        </div>
      </div>

      {(tab === "manual" || isEdit) && (
        <>
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/40 rounded-lg">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!canEditTimes && isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={!canEditTimes && isEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 60"
                disabled={!canEditTimes && isEdit}
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-muted/40 rounded-lg">
            <div className="flex justify-between">
              <Label>Progress</Label>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Slider
              value={[progress]}
              onValueChange={(vals) => setProgress(vals[0])}
              max={100}
              step={5}
              disabled={!canEditDetails && isEdit}
            />
          </div>
        </>
      )}

      <div className="flex justify-between pt-4">
        {isEdit && onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button type="submit">
            {isEdit
              ? "Update"
              : tab === "timer"
                ? t("start")
                : "Create Activity"}
          </Button>
        </div>
      </div>
    </form>
  );
}
