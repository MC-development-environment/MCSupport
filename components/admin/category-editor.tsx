"use client";

import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTicketCategory } from "@/actions/ticket-actions";
import { toast } from "sonner";
import { translateError } from "@/lib/error-codes";
import { useTranslations } from "next-intl";

// 8 categorías simplificadas
const CATEGORIES = [
  {
    value: "SERVICE_COMPLAINT",
    label: { es: "Queja o Reclamo", en: "Complaint" },
  },
  {
    value: "SUPPORT",
    label: { es: "Soporte Técnico", en: "Technical Support" },
  },
  { value: "CONSULTING", label: { es: "Consultoría", en: "Consulting" } },
  { value: "DEVELOPMENT", label: { es: "Desarrollo", en: "Development" } },
  {
    value: "INFRASTRUCTURE",
    label: { es: "Infraestructura", en: "Infrastructure" },
  },
  { value: "NETWORK", label: { es: "Redes", en: "Network" } },
  { value: "ACCOUNTING", label: { es: "Contabilidad", en: "Accounting" } },
  { value: "OTHER", label: { es: "Otro", en: "Other" } },
] as const;

interface CategoryEditorProps {
  ticketId: string;
  currentCategory: string;
  canEdit: boolean;
}

export function CategoryEditor({
  ticketId,
  currentCategory,
  canEdit,
}: CategoryEditorProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "es";
  const tCommon = useTranslations("Common");
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState(currentCategory);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    startTransition(async () => {
      const result = await updateTicketCategory(ticketId, newCategory);
      if (result.success) {
        toast.success(
          locale === "es" ? "Categoría actualizada" : "Category updated"
        );
      } else {
        toast.error(translateError(result.error, tCommon));
        setCategory(currentCategory); // Revertir
      }
    });
  };

  if (!canEdit) {
    const categoryData = CATEGORIES.find((c) => c.value === category);
    const label = categoryData
      ? categoryData.label[locale as "es" | "en"]
      : category;
    return <span className="text-sm">{label}</span>;
  }

  // Obtener etiqueta actual para mostrar
  const currentLabel =
    CATEGORIES.find((c) => c.value === category)?.label[
      locale as "es" | "en"
    ] || category;

  return (
    <Select
      value={category}
      onValueChange={handleCategoryChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={currentLabel}>{currentLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((cat) => (
          <SelectItem key={cat.value} value={cat.value}>
            {cat.label[locale as "es" | "en"]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
