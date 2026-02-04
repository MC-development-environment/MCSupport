"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { Progress } from "@/components/ui/progress";

interface SlaTimerProps {
    slaTargetAt: Date | null | undefined; // Permitir cadena si se pasa desde componente servidor como cadena ISO, pero usualmente objeto Date
    createdAt: Date;
    status: string;
    locale: string;
}

export function SlaTimer({ slaTargetAt, createdAt, status, locale }: SlaTimerProps) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    if (!slaTargetAt || status === "CLOSED" || status === "RESOLVED") {
        return null;
    }

    const targetDate = new Date(slaTargetAt);
    const createdDate = new Date(createdAt);
    
    // Cálculos
    const totalDuration = targetDate.getTime() - createdDate.getTime();
    const elapsed = now.getTime() - createdDate.getTime();
    const remaining = targetDate.getTime() - now.getTime();
    
    // Progreso 0-100
    // Si transcurrido > total, significa que estamos vencidos (más de 100%)
    const progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    const isExpired = remaining < 0;
    const isWarning = !isExpired && (remaining / (1000 * 60 * 60)) < 2; // Menos de 2 horas

    const dateLocale = locale === 'es' ? es : enUS;

    let statusColor = "bg-green-500";
    let textColor = "text-green-600";
    
    if (isExpired) {
        statusColor = "bg-destructive";
        textColor = "text-destructive";
    } else if (isWarning || progressPercentage > 75) {
        statusColor = "bg-yellow-500";
        textColor = "text-yellow-600";
    }

    return (
        <div className="space-y-2 mb-4 p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
                <div className={cn("flex items-center gap-2 font-medium", textColor)}>
                    {isExpired ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    <span className="text-sm">
                        {isExpired 
                            ? (locale === 'es' ? "Vencido hace" : "Overdue by") 
                            : (locale === 'es' ? "Vence en" : "Due in")
                        } {formatDistanceToNow(targetDate, { locale: dateLocale })}
                    </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                    {Math.round(progressPercentage)}%
                </span>
            </div>
            <Progress value={progressPercentage} className="h-2" indicatorClassName={cn(statusColor, isExpired && "animate-pulse")} />
        </div>
    );
}
