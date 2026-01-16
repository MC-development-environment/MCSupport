import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: Date;
  createdAt: Date;
}

export default async function PortalTicketsPage() {
  const session = await auth();
  const t = await getTranslations("Portal");
  const tCommon = await getTranslations("Common");
  const tAdmin = await getTranslations("Admin");

  // Middleware should handle protection, but good to check.
  if (!session?.user?.id) {
    return <div>{tCommon("loading")}</div>;
  }

  const tickets = await prisma.case.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" className="pl-0 gap-2">
          <Link href="/portal">
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            {t("myTicketsTitle")}
          </h1>
          <p className="text-muted-foreground">{t("myTicketsDesc")}</p>
        </div>
        <Link href="/portal/tickets/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            {t("newTicketTitle")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentTickets")}</CardTitle>
          <CardDescription>{t("myTicketsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ticketDetails")}</TableHead>
                  <TableHead>{t("subject")}</TableHead>
                  <TableHead>{t("priority")}</TableHead>
                  <TableHead>{tAdmin("status")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("TicketDetail.created")}
                  </TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket: Ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.ticketNumber ||
                        String(ticket.id).substring(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{ticket.title}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {/* Optional: Truncated description */}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(ticket.createdAt, "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/portal/tickets/${ticket.id}`}>
                          {t("viewHistory")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {tickets.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-24 text-muted-foreground"
                    >
                      {t("noTickets")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
