"use client";

import { Case, User } from "@prisma/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MessageSquare, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

// Tipo extendido para incluir relaciones
type ExtendedTicket = Case & {
    user: User;
    _count: { messages: number };
};

interface MyWorkBoardProps {
    tickets: ExtendedTicket[];
}

export function MyWorkBoard({ tickets }: MyWorkBoardProps) {
    if (tickets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <CheckCircle2 className="h-16 w-16 mb-4 text-green-500" />
                <h3 className="text-xl font-medium">¡Todo al día!</h3>
                <p>No tienes tickets pendientes asignados.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
            ))}
        </div>
    );
}

function TicketCard({ ticket }: { ticket: ExtendedTicket }) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Tipos de Prisma obsoletos
    const slaTarget = ticket.slaTargetAt ? new Date(ticket.slaTargetAt) : null;
    const now = new Date();
    
    // Cálculo de SLA
    let slaStatus: "safe" | "warning" | "danger" | "expired" = "safe";
    let progress = 0;
    let timeLeftText = "Sin SLA";

    if (slaTarget) {
        const totalDuration = slaTarget.getTime() - new Date(ticket.createdAt).getTime();
        const elapsed = now.getTime() - new Date(ticket.createdAt).getTime();
        const remaining = slaTarget.getTime() - now.getTime();
        
        // Calcular progreso (0% a 100%)
        // Si transcurrido > total, estamos sobre 100%
        progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

        if (remaining < 0) {
            slaStatus = "expired";
            timeLeftText = `Vencido hace ${formatDistanceToNow(slaTarget, { locale: es })}`;
            progress = 100;
        } else {
            const hoursRemaining = remaining / (1000 * 60 * 60);
            timeLeftText = formatDistanceToNow(slaTarget, { locale: es, addSuffix: true });
            
            if (hoursRemaining < 2) { // Menos de 2 horas
                 slaStatus = "danger";
            } else if (progress > 75) { // Más del 75% del tiempo usado
                 slaStatus = "warning";
            }
        }
    }

    const priorityColors = {
        LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
        CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };

    const slaColors = {
        safe: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-orange-500",
        expired: "bg-red-600 animate-pulse",
    };

    return (
        <Card className="flex flex-col overflow-hidden border-l-4" style={{
            borderLeftColor: slaStatus === 'expired' ? '#dc2626' : 
                             slaStatus === 'danger' ? '#f97316' : 
                             slaStatus === 'warning' ? '#eab308' : '#22c55e'
        }}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Badge variant="outline" className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                        #{ticket.ticketNumber}
                    </span>
                </div>
                <CardTitle className="text-lg font-semibold line-clamp-1" title={ticket.title}>
                    <Link href={`/admin/tickets/${ticket.id}`} className="hover:underline">
                        {ticket.title}
                    </Link>
                </CardTitle>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <span className="truncate">{ticket.user.name}</span>
                </div>
            </CardHeader>
            <CardContent className="pb-2 flex-1">
                <div className="space-y-4">
                     {/* Barra de SLA */}
                     {slaTarget && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className={
                                    slaStatus === 'expired' ? "text-red-600 font-bold" : 
                                    slaStatus === 'danger' ? "text-orange-600 font-medium" : "text-muted-foreground"
                                }>
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {slaStatus === 'expired' ? "Vencido" : "Vence"} {timeLeftText}
                                </span>
                                <span className="text-muted-foreground">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" indicatorClassName={slaColors[slaStatus]} />
                        </div>
                     )}
                     
                     <div className="flex items-center text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {ticket._count.messages} mensajes
                     </div>
                </div>
            </CardContent>
            <CardFooter className="pt-2">
                <Button asChild className="w-full" variant={slaStatus === 'expired' || slaStatus === 'danger' ? "destructive" : "default"}>
                    <Link href={`/admin/tickets/${ticket.id}`}>
                        Gestionar Ticket
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
