
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TicketSurvey } from "@/components/portal/ticket-survey";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{
    ticketId: string;
    locale: string;
  }>;
}

export default async function SurveyPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const { ticketId } = await params;
  const t = await getTranslations("Portal.Survey");

  const ticket = await prisma.case.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true, ticketNumber: true, title: true, status: true },
  });

  if (!ticket) {
    notFound();
  }

  if (ticket.userId !== session.user.id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="text-xl font-bold text-destructive">{t("unauthorized")}</h1>
        <Button asChild variant="outline">
          <Link href="/portal/tickets">{t("backToTickets")}</Link>
        </Button>
      </div>
    );
  }

  // Check if survey exists
  const survey = await prisma.survey.findUnique({
    where: { ticketId },
  });

  if (survey) {
     return (
      <div className="container mx-auto max-w-lg py-12 px-4">
         <div className="text-center space-y-4 bg-muted/30 p-8 rounded-lg border">
            <h2 className="text-2xl font-bold text-primary">{t("alreadyCompletedTitle")}</h2>
            <p className="text-muted-foreground">{t("alreadyCompletedDesc")}</p>
            <Button asChild className="mt-4">
                <Link href={`/portal/tickets/${ticketId}`}>{t("backToTicket")}</Link>
            </Button>
         </div>
      </div>
     );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4 space-y-8">
        <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
                <Link href={`/portal/tickets/${ticketId}`}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {t("backToTicket")}
                </Link>
            </Button>
        </div>

        <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Ticket #{ticket.ticketNumber}</h1>
            <p className="text-lg text-muted-foreground">{ticket.title}</p>
        </div>

        <TicketSurvey ticketId={ticket.id} />
    </div>
  );
}
