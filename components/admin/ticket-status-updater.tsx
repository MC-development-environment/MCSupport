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
import { updateTicketStatus } from "@/actions/ticket-actions"
import { toast } from "sonner" // We don't have sonner installed yet, maybe basic alert or just state?
// Let's stick to basic state or install sonner later. For now console log.

interface Props {
    ticketId: string
    currentStatus: string
}

export function TicketStatusUpdater({ ticketId, currentStatus }: Props) {
    const [status, setStatus] = React.useState(currentStatus)
    const [isPending, startTransition] = React.useTransition()
    const t = useTranslations('Enums.Status')
    const tCommon = useTranslations('Admin') // For "status" label if needed, or just hardcode "Estado" if consistent with other places

    const handleStatusChange = (value: string) => {
        setStatus(value)
        startTransition(async () => {
            const result = await updateTicketStatus(ticketId, value)
            if (!result.success) {
                // Revert on failure
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
                <SelectValue placeholder={tCommon('status')} />
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
