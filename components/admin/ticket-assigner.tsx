"use client"

import { useState, useTransition } from "react"
import { assignTicket } from "@/actions/ticket-actions"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

interface Props {
    ticketId: string
    currentAssigneeId?: string | null
    users: { id: string; name: string | null; email: string }[]
}

export function TicketAssigner({ ticketId, currentAssigneeId, users }: Props) {
    const [isPending, startTransition] = useTransition()
    const [assignee, setAssignee] = useState<string | undefined>(currentAssigneeId || undefined)
    const t = useTranslations('Admin.TicketDetail')
    const tCommon = useTranslations('Common')

    function onValueChange(value: string) {
        setAssignee(value)
        startTransition(async () => {
            const result = await assignTicket(ticketId, value)
            if (!result.success) {
                toast.error(tCommon('error'))
            } else {
                toast.success(tCommon('success') || "Asignado exitosamente") // Add success key if missing
            }
        })
    }

    return (
        <Select disabled={isPending} value={assignee} onValueChange={onValueChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={t('unassigned')} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="unassigned" disabled>{t('assignee')}</SelectItem>
                {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
