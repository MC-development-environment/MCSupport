import { format } from "date-fns"
import { es, enUS } from "date-fns/locale"
import { useLocale } from "next-intl"
import { Prisma } from "@prisma/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AuditLogEntry {
    id: string
    action: string
    actor: {
        name: string | null
        email: string
    }
    createdAt: Date
    details: Prisma.JsonValue
}

interface Props {
    logs: AuditLogEntry[]
    emptyText: string
}

export function AuditLogTimeline({ logs, emptyText }: Props) {
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;

    if (logs.length === 0) {
        return <div className="text-sm text-muted-foreground p-4">{emptyText}</div>
    }

    return (
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <div className="space-y-6">
                {logs.map((log) => (
                    <div key={log.id} className="relative flex gap-4">
                        <Avatar className="h-8 w-8 border">
                            <AvatarImage src={`https://avatar.vercel.sh/${log.actor.email}`} alt={log.actor.name || "User"} />
                            <AvatarFallback>{(log.actor.name?.[0] || log.actor.email[0]).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{log.actor.name || log.actor.email}</p>
                                <span className="text-xs text-muted-foreground">{format(log.createdAt, "PPP p", { locale: dateLocale })}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">{log.action}</span>
                                {log.details && (
                                    <span className="ml-2 font-mono text-xs text-foreground/80">
                                        {JSON.stringify(log.details)}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
