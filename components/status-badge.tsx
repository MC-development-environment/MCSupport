import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"

interface Props {
    status: string
}

export function StatusBadge({ status }: Props) {
    const t = useTranslations('Enums.Status')

    // Fallback if status not found in enums
    const label = t.has(status) ? t(status) : status

    let className = "whitespace-nowrap font-medium"

    // Custom colors to unified system
    // Premium "Modern SaaS" Palette
    // Uses semi-transparent backgrounds + borders for a sophisticated look
    switch (status) {
        case 'OPEN':
            // Blue: Trustworthy, Clean, Active
            className += " bg-blue-500/10 text-blue-700 border-blue-500/20"
            break
        case 'IN_PROGRESS':
            // Amber: Warm, Active, Distinct from Red/Green
            className += " bg-amber-500/10 text-amber-700 border-amber-500/20"
            break
        case 'WAITING_CUSTOMER':
            // "Lighter Text" request
            // bg-gray-500/15 + text-gray-500 (Lighter than 600)
            className += " bg-gray-500/15 text-gray-500 border-gray-500/20"
            break
        case 'RESOLVED':
            // Emerald: Success, Positive, Fresh
            className += " bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
            break
        case 'CLOSED':
            // Violet: Completed, Distinct, Final
            className += " bg-violet-500/10 text-violet-700 border-violet-500/20"
            break
        default:
            className += " bg-gray-500/10 text-gray-700 border-gray-500/20"
    }

    return (
        <Badge variant="outline" className={className}>
            {label}
        </Badge>
    )
}
