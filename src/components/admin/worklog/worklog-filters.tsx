"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ActivityType } from "@prisma/client";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select as UISelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { cn } from "@/common/utils/utils";

export interface WorkLogFiltersState {
  type?: ActivityType;
  project?: string;
  client?: string;
  search?: string;
  dateRange?: DateRange;
}

interface WorkLogFiltersProps {
  filters: WorkLogFiltersState;
  onChange: (filters: WorkLogFiltersState) => void;
  projects?: string[];
  clients?: string[];
  className?: string;
}

export function WorkLogFilters({
  filters,
  onChange,
  projects = [],
  clients = [],
  className,
}: WorkLogFiltersProps) {
  const t = useTranslations("Admin.WorkLog");
  const tTypes = useTranslations("Admin.WorkLog.ActivityTypes");
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Contar filtros activos
  const activeFiltersCount = [
    filters.type,
    filters.project,
    filters.client,
    filters.dateRange?.from,
  ].filter(Boolean).length;

  // Actualizar filtro
  const updateFilter = useCallback(
    <K extends keyof WorkLogFiltersState>(
      key: K,
      value: WorkLogFiltersState[K],
    ) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  // Limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    setSearchInput("");
    onChange({});
  }, [onChange]);

  // Debounce para búsqueda
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      const timeout = setTimeout(() => {
        updateFilter("search", value || undefined);
      }, 300);
      return () => clearTimeout(timeout);
    },
    [updateFilter],
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Búsqueda */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-8 h-9"
        />
        {searchInput && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtro por tipo */}
      <UISelect
        value={filters.type || "all"}
        onValueChange={(v) =>
          updateFilter("type", v === "all" ? undefined : (v as ActivityType))
        }
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder={t("allTypes")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allTypes")}</SelectItem>
          {Object.values(ActivityType).map((type) => (
            <SelectItem key={type} value={type}>
              {tTypes(type)}
            </SelectItem>
          ))}
        </SelectContent>
      </UISelect>

      {/* DateRangePicker */}
      <DateRangePicker
        value={filters.dateRange}
        onChange={(range) => updateFilter("dateRange", range)}
        placeholder={t("dateRange")}
        className="h-9"
      />

      {/* Filtros avanzados (popover) */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={activeFiltersCount > 0 ? "secondary" : "outline"}
            size="sm"
            className="h-9 gap-1.5"
          >
            <Filter className="h-4 w-4" />
            {t("filters")}
            {activeFiltersCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-4" align="end">
          <div className="space-y-4">
            <div className="font-medium text-sm">{t("advancedFilters")}</div>

            {/* Filtro por proyecto */}
            {projects.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  {t("project")}
                </label>
                <UISelect
                  value={filters.project || "all"}
                  onValueChange={(v) =>
                    updateFilter("project", v === "all" ? undefined : v)
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={t("allProjects")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allProjects")}</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </UISelect>
              </div>
            )}

            {/* Filtro por cliente */}
            {clients.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  {t("client")}
                </label>
                <UISelect
                  value={filters.client || "all"}
                  onValueChange={(v) =>
                    updateFilter("client", v === "all" ? undefined : v)
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={t("allClients")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allClients")}</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client} value={client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </UISelect>
              </div>
            )}

            {/* Botón limpiar */}
            {(activeFiltersCount > 0 || searchInput) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={clearAllFilters}
              >
                <X className="h-3 w-3 mr-1" />
                {t("clearFilters")}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Badges de filtros activos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.type && (
            <Badge variant="secondary" className="gap-1 pl-2 pr-1">
              {tTypes(filters.type)}
              <button
                onClick={() => updateFilter("type", undefined)}
                className="hover:bg-muted/50 rounded-sm p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.project && (
            <Badge variant="secondary" className="gap-1 pl-2 pr-1">
              {filters.project}
              <button
                onClick={() => updateFilter("project", undefined)}
                className="hover:bg-muted/50 rounded-sm p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.client && (
            <Badge variant="secondary" className="gap-1 pl-2 pr-1">
              {filters.client}
              <button
                onClick={() => updateFilter("client", undefined)}
                className="hover:bg-muted/50 rounded-sm p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
