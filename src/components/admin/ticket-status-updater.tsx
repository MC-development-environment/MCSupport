"use client"

import * as React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { updateTicketStatus } from "@/common/actions/ticket-actions"
import { toast } from "sonner" // Aún no tenemos sonner instalado, ¿quizás alerta básica o solo estado?
// Vamos a quedarnos con estado básico o instalar sonner después. Por ahora registro en consola.

interface Props {
    ticketId: string
    currentStatus: string
}

export function TicketStatusUpdater({ ticketId, currentStatus }: Props) {
    const [status, setStatus] = React.useState(currentStatus)
    const [isPending, startTransition] = React.useTransition()
    const t = useTranslations('Enums.Status')

    const handleStatusChange = (value: string) => {
        setStatus(value)
        startTransition(async () => {
            const result = await updateTicketStatus(ticketId, value)
            if (!result.success) {
                // Revertir en caso de fallo
                setStatus(currentStatus)
                toast.error("Error al actualizar estado")
            } else {
                toast.success("Estado actualizado correctamente")
            }
        })
    }

    return (
        <Select value={status} onValueChange={handleStatusChange} disabled={isPending}>
            <SelectTrigger className="w-[180px]">
                <SelectValue>{t(status as 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED')}</SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="OPEN">{t('OPEN')}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t('IN_PROGRESS')}</SelectItem>
                <SelectItem value="WAITING_CUSTOMER">{t('WAITING_CUSTOMER')}</SelectItem>
                <SelectItem value="RESOLVED">{t('RESOLVED')}</SelectItem>
                <SelectItem value="CLOSED">{t('CLOSED')}</SelectItem>
            </SelectContent>
        </Select>
    )
}
