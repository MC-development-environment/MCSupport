import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"

interface Props {
    priority: string
}

export function PriorityBadge({ priority }: Props) {
    const t = useTranslations('Enums.Priority')

    // Fallback
    const label = t.has(priority) ? t(priority) : priority

    let className = ""

    // Priority Gradient based on Severity
    // Critical: Rose
    // High: Orange
    // Medium: Blue (Better distinction vs Orange than Amber)
    // Low: Slate
    switch (priority) {
        case 'LOW':
            className = "bg-slate-500 hover:bg-slate-600 text-white border-transparent"
            break
        case 'MEDIUM':
            className = "bg-blue-500 hover:bg-blue-600 text-white border-transparent"
            break
        case 'HIGH':
            className = "bg-orange-500 hover:bg-orange-600 text-white border-transparent"
            break
        case 'CRITICAL':
            className = "bg-rose-500 hover:bg-rose-600 text-white border-transparent"
            break
        default:
            className = "bg-gray-500 text-white"
    }

    return (
        <Badge className={className}>
            {label}
        </Badge>
    )
}
