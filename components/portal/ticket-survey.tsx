"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitSurvey } from "@/actions/portal-ticket-actions";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  ticketId: string;
}

export function TicketSurvey({ ticketId }: Props) {
  const t = useTranslations("Portal.Survey");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    if (rating === 0) {
      toast.error(t("ratingRequired"));
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("rating", rating.toString());
      formData.append("comment", comment);

      const result = await submitSurvey(ticketId, formData);

      if (result.success) {
        setSubmitted(true);
        toast.success(t("successMessage"));
        router.refresh();
      } else {
        toast.error(result.error || t("errorMessage"));
      }
    });
  }

  if (submitted) {
    return (
      <Card className="max-w-md mx-auto text-center p-8">
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <Star className="h-8 w-8 text-green-600 dark:text-green-400 fill-current" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">{t("thankYou")}</h2>
          <p className="text-muted-foreground">{t("feedbackReceived")}</p>
          <Button onClick={() => router.push("/portal/tickets")} variant="outline" className="mt-4">
            {t("backToTickets")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <p className="text-muted-foreground">{t("description")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-transform hover:scale-110"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={`h-10 w-10 ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 dark:text-gray-600"
                } transition-colors duration-200`}
              />
            </button>
          ))}
        </div>
        <div className="text-center text-sm font-medium text-muted-foreground min-h-[20px]">
          {hoverRating > 0 || rating > 0 ? (
            <span>
                {(hoverRating || rating) === 1 && t("rating1")}
                {(hoverRating || rating) === 2 && t("rating2")}
                {(hoverRating || rating) === 3 && t("rating3")}
                {(hoverRating || rating) === 4 && t("rating4")}
                {(hoverRating || rating) === 5 && t("rating5")}
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("commentLabel")}</label>
          <Textarea
            placeholder={t("commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
            className="w-full" 
            onClick={handleSubmit} 
            disabled={isPending || rating === 0}
            size="lg"
        >
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </CardFooter>
    </Card>
  );
}
