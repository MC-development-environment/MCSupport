"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Send, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { getReportRecipients, sendReport } from "@/actions/report-actions"

type Recipient = {
    id: string
    name: string | null
    email: string
    role: string
    department: { name: string } | null
}

type ReportPeriod = 'weekly' | 'biweekly' | 'monthly' | 'yearly'

const PERIODS: { value: ReportPeriod; labelEs: string; labelEn: string }[] = [
    { value: 'weekly', labelEs: 'Semanal', labelEn: 'Weekly' },
    { value: 'biweekly', labelEs: 'Quincenal', labelEn: 'Biweekly' },
    { value: 'monthly', labelEs: 'Mensual', labelEn: 'Monthly' },
    { value: 'yearly', labelEs: 'Anual', labelEn: 'Yearly' },
]

export function SendReportDialog() {
    const t = useTranslations('Admin.Reports')
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(false)
    const [recipients, setRecipients] = useState<Recipient[]>([])
    const [currentUser, setCurrentUser] = useState<{ name: string | null; role: string; department?: string } | null>(null)
    
    const [recipientId, setRecipientId] = useState<string>("")
    const [period, setPeriod] = useState<ReportPeriod>("weekly")
    const [message, setMessage] = useState("")

    // Cargar destinatarios cuando se abre el diálogo
    const loadRecipients = async () => {
        setIsLoading(true)
        try {
            const result = await getReportRecipients()
            if ('recipients' in result) {
                setRecipients(result.recipients || [])
                setCurrentUser(result.currentUser || null)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (newOpen) {
            loadRecipients()
        }
    }

    const handleSend = () => {
        if (!recipientId) {
            toast.error(t('selectRecipientError') || "Selecciona un destinatario")
            return
        }

        startTransition(async () => {
            const result = await sendReport({
                recipientId,
                period,
                message: message || undefined
            })

            if ('error' in result) {
                toast.error(result.error)
            } else {
                toast.success(result.message)
                setOpen(false)
                setRecipientId("")
                setMessage("")
            }
        })
    }

    // Detectar locale
    const locale = typeof document !== 'undefined' 
        ? (document.documentElement.lang || 'es') 
        : 'es'

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Mail className="h-4 w-4" />
                    {t('sendReport') || 'Enviar Reporte'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        {t('sendReportTitle') || 'Enviar Reporte'}
                    </DialogTitle>
                    <DialogDescription>
                        {t('sendReportDesc') || 'Envía tu reporte de actividad a tu supervisor'}
                    </DialogDescription>
                </DialogHeader>

                {currentUser && (
                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        <p><strong>{t('from') || 'De'}:</strong> {currentUser.name || 'Usuario'} ({currentUser.role})</p>
                        {currentUser.department && (
                            <p><strong>{t('department') || 'Departamento'}:</strong> {currentUser.department}</p>
                        )}
                    </div>
                )}

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="recipient">{t('recipient') || 'Destinatario'}</Label>
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('loading') || 'Cargando...'}
                            </div>
                        ) : recipients.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {t('noRecipients') || 'No hay destinatarios disponibles para tu rol'}
                            </p>
                        ) : (
                            <Select value={recipientId} onValueChange={setRecipientId}>
                                <SelectTrigger id="recipient">
                                    <SelectValue placeholder={t('selectRecipient') || 'Seleccionar destinatario'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {recipients.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                            <div className="flex flex-col">
                                                <span>{r.name || r.email}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {r.role} {r.department ? `- ${r.department.name}` : ''}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="period">{t('period') || 'Período'}</Label>
                        <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
                            <SelectTrigger id="period">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERIODS.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {locale === 'en' ? p.labelEn : p.labelEs}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="message">
                            {t('additionalMessage') || 'Mensaje adicional'} 
                            <span className="text-muted-foreground text-xs ml-1">(opcional)</span>
                        </Label>
                        <Textarea
                            id="message"
                            placeholder={t('messagePlaceholder') || 'Añade comentarios o notas...'}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        {t('cancel') || 'Cancelar'}
                    </Button>
                    <Button 
                        onClick={handleSend} 
                        disabled={isPending || !recipientId || recipients.length === 0}
                        className="gap-2"
                    >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Send className="h-4 w-4" />
                        {t('send') || 'Enviar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
