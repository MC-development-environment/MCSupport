/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";
import { prisma } from "@/infrastructure/db/prisma";
import { auth } from "@/core/auth";
import { Link } from "@/common/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  ChevronLeft,
  User,
  AlertCircle,
  Users,
  History,
  LayoutDashboard,
  Lock,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { TicketStatusUpdater } from "@/components/admin/ticket-status-updater";
import { TicketAssigner } from "@/components/admin/ticket-assigner";
import { AuditLogTimeline } from "@/components/admin/audit-log-timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { SentimentBadge } from "@/components/sentiment-badge";
import { CategoryBadge } from "@/components/category-badge";
import { AttachmentSection } from "@/components/attachments/attachment-section";
import { TicketConversation } from "@/components/portal/ticket-conversation";
import { getMessages } from "@/common/actions/ticket-actions";
import { CategoryEditor } from "@/components/admin/category-editor";
import { ReopenTicketDialog } from "@/components/admin/reopen-ticket-dialog";
import { SlaTimer } from "@/components/admin/sla-timer";

interface Props {
  params: Promise<{
    ticketId: string;
    locale: string;
  }>;
}

export default async function TicketDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const { ticketId } = resolvedParams;

  // Ejecutar consultas en paralelo para mejor rendimiento
  const [t, session, ticket] = await Promise.all([
    getTranslations("Admin.TicketDetail"),
    auth(),
    prisma.case.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
        assignedTo: true,
        assignedBy: {
          // Quién realizó la asignación
          select: { id: true, name: true, email: true, role: true },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
          include: {
            uploader: {
              select: { name: true, email: true },
            },
          },
        },
      },
    }),
  ]);

  if (!ticket) {
    return <div>Ticket not found</div>;
  }

  // Access Control - ROOT, ADMIN, and MANAGER can see all tickets
  const fullAccessRoles = ["ROOT", "ADMIN", "MANAGER"];
  if (!fullAccessRoles.includes(session?.user?.role || "")) {
    const isOwner = ticket.userId === session?.user?.id;
    const isAssigned = ticket.assignedToId === session?.user?.id;

    if (!isOwner && !isAssigned) {
      return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h2 className="text-xl font-semibold">Acceso Denegado</h2>
          <p className="text-muted-foreground">
            No tienes permisos para ver este ticket.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/tickets">{t("back")}</Link>
          </Button>
        </div>
      );
    }
  }

  // RBAC Assignment Filtering - calcular filtro para agentes según rol
  // Reglas de asignación:
  // - MANAGER: cualquier colaborador (no CLIENT, no VIRTUAL_ASSISTANT)
  // - SERVICE_OFFICER: cualquier colaborador
  // - TEAM_LEAD: TECHNICAL_LEAD/TECHNICIAN (su dept) + SERVICE_OFFICER + TEAM_LEAD (cualquier dept)
  // - TECHNICAL_LEAD: TECHNICIAN (su dept) + SERVICE_OFFICER
  // - TECHNICIAN: solo SERVICE_OFFICER
  let agentWhereClause: any = {};
  let currentUser = null;

  if (session?.user?.id) {
    currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, departmentId: true },
    });

    if (currentUser) {
      const isSuperUser = ["ROOT", "ADMIN", "MANAGER"].includes(
        currentUser.role || ""
      );
      const isServiceOfficer = currentUser.role === "SERVICE_OFFICER";

      if (isSuperUser || isServiceOfficer) {
        // MANAGER y SERVICE_OFFICER pueden asignar a cualquier colaborador
        agentWhereClause = {
          role: {
            notIn: ["CLIENT", "VIRTUAL_ASSISTANT"],
          },
        };
      } else if (currentUser.role === "TEAM_LEAD") {
        // TEAM_LEAD: TECHNICAL_LEAD/TECHNICIAN (dept) + SERVICE_OFFICER + TEAM_LEAD (cualquier dept)
        agentWhereClause = {
          OR: [
            // Técnicos y líderes técnicos de su departamento
            {
              departmentId: currentUser.departmentId,
              role: { in: ["TECHNICAL_LEAD", "TECHNICIAN"] },
            },
            // Oficial de servicio (no VIRTUAL_ASSISTANT)
            {
              role: "SERVICE_OFFICER",
            },
            // Otros líderes de equipo de cualquier departamento
            {
              role: "TEAM_LEAD",
            },
          ],
          // Excluir asistente virtual
          NOT: { role: "VIRTUAL_ASSISTANT" },
        };
      } else if (currentUser.role === "TECHNICAL_LEAD") {
        // TECHNICAL_LEAD: TECHNICIAN (dept) + SERVICE_OFFICER
        agentWhereClause = {
          OR: [
            // Técnicos de su departamento
            {
              departmentId: currentUser.departmentId,
              role: "TECHNICIAN",
            },
            // Oficial de servicio
            {
              role: "SERVICE_OFFICER",
            },
          ],
          NOT: { role: "VIRTUAL_ASSISTANT" },
        };
      } else if (currentUser.role === "TECHNICIAN") {
        // TECHNICIAN: solo SERVICE_OFFICER
        agentWhereClause = {
          role: "SERVICE_OFFICER",
          NOT: { role: "VIRTUAL_ASSISTANT" },
        };
      } else {
        // Otros roles no pueden asignar (CONSULTANT, DEVELOPER, etc.)
        agentWhereClause = { id: "none" };
      }
    }
  }

  // Ejecutar consultas restantes en paralelo
  const [agents, auditLogs, messages] = await Promise.all([
    prisma.user.findMany({
      where: agentWhereClause,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.auditLog.findMany({
      where: {
        entity: "TICKET",
        entityId: ticketId,
      },
      include: {
        actor: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getMessages(ticketId),
  ]);

  return (
    <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon" className="h-7 w-7">
            <Link href="/admin/tickets">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{t("back")}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="h-7 w-7">
            <Link href="/admin">
              <LayoutDashboard className="h-4 w-4" />
              <span className="sr-only">{t("dashboard")}</span>
            </Link>
          </Button>
        </div>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {t("title")} {ticket.ticketNumber}
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">{t("details")}</TabsTrigger>
              <TabsTrigger value="conversation">
                {t("conversation") || "Mensajes"}
              </TabsTrigger>
              <TabsTrigger value="history">{t("history")}</TabsTrigger>
            </TabsList>
            <TabsContent value="details">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>{ticket.title}</CardTitle>
                  <CardDescription className="max-w-lg text-balance leading-relaxed">
                    {t("createdAt")}{" "}
                    {format(ticket.createdAt, "PPP p", {
                      locale: resolvedParams.locale === "es" ? es : enUS,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-3">
                      <h3 className="font-semibold">{t("description")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {ticket.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="conversation">
              <div className="h-[600px]">
                <TicketConversation
                  ticketId={ticket.id}
                  initialMessages={messages as any}
                  userEmail={session?.user?.email}
                  disabled={
                    ticket.status === "CLOSED" || ticket.status === "RESOLVED"
                  }
                  ticketDescription={ticket.description || ""}
                  ticketCreatedAt={ticket.createdAt}
                  ticketUser={{
                    name: ticket.user.name,
                    email: ticket.user.email,
                  }}
                />
              </div>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    {t("auditLog")}
                  </CardTitle>
                  <CardDescription>{t("auditLogDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <AuditLogTimeline
                    logs={auditLogs}
                    emptyText={t("noActivity")}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Closed ticket notice */}
                {(ticket.status === "CLOSED" ||
                  ticket.status === "RESOLVED") && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm">{t("closedReadOnly")}</span>
                    </div>
                    <Separator />
                  </>
                )}

                {/* SLA Timer */}
                <SlaTimer
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore - Prisma types regeneration pending
                  slaTargetAt={ticket.slaTargetAt}
                  createdAt={ticket.createdAt}
                  status={ticket.status}
                  locale={resolvedParams.locale}
                />

                <div className="grid gap-3">
                  <span className="text-muted-foreground text-xs font-medium">
                    {t("customer")}
                  </span>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {ticket.user.name || ticket.user.email}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ticket.user.email}
                  </div>
                </div>
                <Separator />
                <div className="grid gap-3">
                  <span className="text-muted-foreground text-xs font-medium">
                    {t("assignee")}
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {ticket.assignedTo
                        ? ticket.assignedTo.name || ticket.assignedTo.email
                        : t("unassigned")}
                    </span>
                  </div>
                  {/* Mostrar quién realizó la asignación */}
                  {ticket.assignedBy && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <span>{t("assignedBy")}:</span>
                      <span className="font-medium">
                        {ticket.assignedBy.name || ticket.assignedBy.email}
                      </span>
                    </div>
                  )}
                  {/* Hide assigner for closed tickets */}
                  {ticket.status !== "CLOSED" &&
                    ticket.status !== "RESOLVED" && (
                      <TicketAssigner
                        ticketId={ticket.id}
                        currentAssigneeId={ticket.assignedToId}
                        users={agents}
                      />
                    )}
                </div>
                <Separator />
                <div className="grid gap-3">
                  <span className="text-muted-foreground text-xs font-medium">
                    {t("priority")}
                  </span>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
                <Separator />
                {/* Status section - below priority */}
                <div className="grid gap-3">
                  <span className="text-muted-foreground text-xs font-medium">
                    {t("status")}
                  </span>
                  {/* Show status or reopen button for closed tickets */}
                  {ticket.status === "CLOSED" ||
                  ticket.status === "RESOLVED" ? (
                    <ReopenTicketDialog
                      ticketId={ticket.id}
                      locale={resolvedParams.locale}
                    />
                  ) : (
                    <TicketStatusUpdater
                      ticketId={ticket.id}
                      currentStatus={ticket.status}
                    />
                  )}
                </div>
                <Separator />
                <div className="grid gap-3">
                  <span className="text-muted-foreground text-xs font-medium">
                    {t("category")}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Manager/Team Lead/Admin/Root can edit category */}
                    {["ROOT", "ADMIN", "MANAGER", "TEAM_LEAD"].includes(
                      session?.user?.role || ""
                    ) &&
                    ticket.status !== "CLOSED" &&
                    ticket.status !== "RESOLVED" ? (
                      <CategoryEditor
                        ticketId={ticket.id}
                        currentCategory={ticket.category || "OTHER"}
                        canEdit={true}
                      />
                    ) : (
                      <CategoryBadge
                        category={ticket.category}
                        locale={resolvedParams.locale}
                      />
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid gap-3">
                  <span className="text-muted-foreground text-xs font-medium">
                    {t("sentiment")}
                  </span>
                  <div className="flex items-center gap-2">
                    <SentimentBadge
                      sentiment={
                        ticket.sentiment as
                          | "POSITIVE"
                          | "NEUTRAL"
                          | "NEGATIVE"
                          | null
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <AttachmentSection
            ticketId={ticket.id}
            attachments={ticket.attachments}
            disabled={
              ticket.status === "CLOSED" || ticket.status === "RESOLVED"
            }
          />
        </div>
      </div>
    </div>
  );
}
