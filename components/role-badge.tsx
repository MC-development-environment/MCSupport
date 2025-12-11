import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"

interface Props {
    role: string
}

const getRoleColor = (role: string) => {
    // User requested to remove specific colors to avoid visual overload.
    // Using a neutral, clean style for all roles.
    return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/50'
}

export function RoleBadge({ role }: Props) {
    const t = useTranslations('Enums.Role')
    // Fallback for roles that might not be in translations yet
    const label = role

    return (
        <Badge
            variant="outline"
            className={`${getRoleColor(role)} border shadow-sm font-medium transition-colors whitespace-nowrap`}
        >
            {/* Try to translate, fallback to raw role string if needed */}
            {t.has(role) ? t(role) : role}
        </Badge>
    )
}
