"use client";

import * as React from "react";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  className?: string;
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DateRangePicker({
  className,
  value,
  onChange,
  placeholder,
  disabled = false,
}: DateRangePickerProps) {
  const locale = useLocale();
  const t = useTranslations("Common.DateRange");
  const dateLocale = locale === "es" ? es : enUS;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "dd MMM yyyy", { locale: dateLocale })} -{" "}
                  {format(value.to, "dd MMM yyyy", { locale: dateLocale })}
                </>
              ) : (
                format(value.from, "dd MMM yyyy", { locale: dateLocale })
              )
            ) : (
              <span>{placeholder || t("placeholder")}</span>
            )}
            {value?.from && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            locale={dateLocale}
            disabled={{ after: new Date() }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
