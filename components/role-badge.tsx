import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface Props {
  role: string;
}

export function RoleBadge({ role }: Props) {
  const t = useTranslations("Enums.Role");

  return (
    <Badge
      variant="outline"
      className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/50 border shadow-sm font-medium transition-colors whitespace-nowrap"
    >
      {/* Try to translate, fallback to raw role string if needed */}
      {t.has(role) ? t(role) : role}
    </Badge>
  );
}
