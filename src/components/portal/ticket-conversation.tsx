"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { addMessage } from "@/common/actions/ticket-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { translateError } from "@/core/services/error-codes";

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  isInternal: boolean;
  sender: {
    name: string | null;
    email: string;
    role: string;
  };
}

interface Props {
  ticketId: string;
  initialMessages: Message[];
  userEmail?: string | null;
  disabled?: boolean;
  ticketDescription?: string;
  ticketCreatedAt?: Date;
  ticketUser?: {
    name: string | null;
    email: string;
  };
}

export function TicketConversation({
  ticketId,
  initialMessages,
  userEmail,
  disabled = false,
  ticketDescription,
  ticketCreatedAt,
  ticketUser,
}: Props) {
  const t = useTranslations("Portal.TicketDetail");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";
  const isStaff = pathname.includes("/admin/");
  const router = useRouter();

  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = initialMessages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [initialMessages, content]);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        const result = await addMessage(ticketId, content, isInternal);
        if (result.success) {
          setContent("");
          setIsInternal(false);
          router.refresh();
          toast.success(t("messageSent"));
        } else {
          toast.error(translateError(result.error, tCommon));
        }
      } catch (error) {
        console.error(error);
        toast.error(translateError(error, tCommon));
      }
    });
  };

  return (
    <Card className="flex flex-col min-h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{t("conversation")}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 pt-2">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-2 scroll-smooth relative"
        >
          {/* Fixed Initial Request Message */}
          {ticketDescription && ticketUser && (
            <div className="sticky top-0 z-10 pb-2 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <div className="flex gap-3 sm:gap-4 flex-row pb-3 mb-3 border-b border-border/30 dark:border-slate-700/50 pl-2">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 mt-1 shrink-0 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm sm:text-base">
                    {(
                      ticketUser.name?.[0] ||
                      ticketUser.email[0] ||
                      "?"
                    ).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start flex-1 min-w-0 gap-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm sm:text-base font-semibold text-foreground">
                      {ticketUser.name || ticketUser.email}
                    </span>
                    <span className="text-[9px] sm:text-[10px] bg-primary/20 dark:bg-primary/30 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      {locale === "es" ? "Ticket Original" : "Original Request"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ticketCreatedAt &&
                        format(new Date(ticketCreatedAt), "dd/MM HH:mm")}
                    </span>
                  </div>
                  <div className="rounded-2xl p-3 text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-600/50 w-full">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {ticketDescription}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t("noMessages")}
            </p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender.email === userEmail;
              const isInternalMsg = msg.isInternal;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    isMe ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className={
                        msg.sender.role === "VIRTUAL_ASSISTANT" ||
                        msg.sender.email === "assistant@multicomputos.com"
                          ? "bg-primary text-primary-foreground"
                          : ""
                      }
                    >
                      {(
                        msg.sender.name?.[0] ||
                        msg.sender.email[0] ||
                        "?"
                      ).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col max-w-[80%] ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">
                        {msg.sender.name || msg.sender.email}
                      </span>
                      {isInternalMsg && (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 rounded border border-amber-200">
                          INTERNAL
                        </span>
                      )}
                      <span
                        className="text-[9px] text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {format(new Date(msg.createdAt), "dd/MM HH:mm")}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg p-3 text-sm ${
                        isInternalMsg
                          ? "bg-amber-50 border border-amber-100 text-amber-900"
                          : isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Entrada de mensaje - oculta cuando está deshabilitado (ticket cerrado) */}
        {!disabled ? (
          <div className="flex flex-col gap-2 mt-auto pt-4 border-t relative z-10">
            {isStaff && (
              <div className="flex items-center gap-2 pb-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span
                    className={isInternal ? "font-semibold text-amber-700" : ""}
                  >
                    Nota Interna (Privada)
                  </span>
                </label>
              </div>
            )}
            <div
              className={`flex gap-2 ${
                isInternal ? "p-1 bg-amber-50/50 rounded-md -m-1" : ""
              }`}
            >
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  isInternal
                    ? "Escribe una nota interna..."
                    : "Escribe un mensaje..."
                }
                className={`min-h-[80px] ${
                  isInternal
                    ? "border-amber-200 focus-visible:ring-amber-500"
                    : ""
                }`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button
                size="icon"
                className={`h-[80px] w-[80px] ${
                  isInternal ? "bg-amber-600 hover:bg-amber-700" : ""
                }`}
                onClick={handleSubmit}
                disabled={isPending || !content.trim()}
              >
                <Send className="h-6 w-6" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-auto pt-4 border-t text-center text-muted-foreground text-sm">
            {locale === "es"
              ? "Este caso está cerrado."
              : "This case is closed."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
