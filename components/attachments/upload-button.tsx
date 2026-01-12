"use client";

import { useTransition } from "react";
import { uploadAttachment } from "@/actions/attachment-actions";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { translateError } from "@/lib/error-codes";

export function UploadButton({
  ticketId,
  currentCount = 0,
  className,
}: {
  ticketId: string;
  currentCount?: number;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const t = useTranslations("Admin.Attachments");
  const tCommon = useTranslations("Common");
  const isMaxReached = currentCount >= 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("ticketId", ticketId);

    startTransition(async () => {
      const res = await uploadAttachment(formData);
      if (res.error) {
        toast.error(translateError(res.error, tCommon));
      } else {
        toast.success(t("success"));
      }
      // Reiniciar entrada
      e.target.value = "";
    });
  };

  return (
    <div className={cn("flex items-center", className)}>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileChange}
        disabled={isPending || isMaxReached}
      />
      <label htmlFor="file-upload" className="w-full">
        <Button
          variant="outline"
          size="sm"
          asChild
          disabled={isPending || isMaxReached}
          className={cn(
            "cursor-pointer w-full",
            isMaxReached && "cursor-not-allowed opacity-50"
          )}
        >
          <span className="flex items-center justify-center">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
            <span className="ml-2">
              {isMaxReached ? t("limitReached") : t("upload")}
            </span>
          </span>
        </Button>
      </label>
    </div>
  );
}
