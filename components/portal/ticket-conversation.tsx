"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { addMessage } from "@/actions/ticket-actions"
import { toast } from "sonner"
import { format } from "date-fns"

interface Message {
    id: string
    content: string
    createdAt: Date
    sender: {
        name: string | null
        email: string
        role: string
    }
}

interface Props {
    ticketId: string
    initialMessages: Message[]
    userEmail?: string | null
}

export function TicketConversation({ ticketId, initialMessages, userEmail }: Props) {
    const t = useTranslations('Portal.TicketDetail')
    const [messages, setMessages] = useState(initialMessages)
    const [content, setContent] = useState("")
    const [isPending, startTransition] = useTransition()

    // ... (handleSubmit logic same) ...
    async function handleSubmit() {
        if (!content.trim()) return

        startTransition(async () => {
            const result = await addMessage(ticketId, content)
            if (result.success) {
                toast.success("Mensaje enviado")
                setContent("")
                window.location.reload()
            } else {
                toast.error(result.error || "Error al enviar mensaje")
            }
        })
    }

    return (
        <Card className="flex flex-col min-h-[400px]">
            <CardHeader>
                <CardTitle>{t('conversation')}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-2">
                    {messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">{t('noMessages')}</p>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender.email === userEmail
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {(msg.sender.name?.[0] || msg.sender.email[0]).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold">
                                                {msg.sender.name || msg.sender.email}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                                {format(new Date(msg.createdAt), "dd/MM HH:mm")}
                                            </span>
                                        </div>
                                        <div
                                            className={`rounded-lg p-3 text-sm ${isMe
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                                }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t relative z-10">
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="min-h-[80px]"
                    />
                    <Button
                        size="icon"
                        className="h-[80px] w-[80px]"
                        onClick={handleSubmit}
                        disabled={isPending || !content.trim()}
                    >
                        <Send className="h-6 w-6" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
