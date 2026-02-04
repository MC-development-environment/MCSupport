"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Palmtree, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deactivateVacationMode } from "@/common/actions/vacation-actions";
import { translateError } from "@/core/services/error-codes";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

interface VacationBannerProps {
  endDate: Date;
}

export function VacationBanner({ endDate }: VacationBannerProps) {
  const t = useTranslations("Vacation");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const formattedDate = format(new Date(endDate), "PPP", {
    locale: locale === "es" ? es : enUS,
  });

  const handleDeactivate = () => {
    startTransition(async () => {
      const result = await deactivateVacationMode();
      if (result.success) {
        toast.success(t("deactivated"));
        router.refresh();
      } else {
        toast.error(translateError(result.error, tCommon));
      }
    });
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 shadow-md">
      <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Palmtree className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{t("bannerTitle")}</p>
            <p className="text-sm text-white/90">
              {t("bannerMessage", { date: formattedDate })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDeactivate}
            disabled={isPending}
            className="bg-white text-amber-600 hover:bg-white/90 hover:text-amber-700"
          >
            <X className="h-4 w-4 mr-1" />
            {t("deactivate")}
          </Button>
        </div>
      </div>
    </div>
  );
}
