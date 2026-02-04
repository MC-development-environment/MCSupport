"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/common/utils/utils"
import { 
    AlertTriangle,
    Headphones,
    GraduationCap,
    Code,
    Server,
    Network,
    Calculator,
    FolderOpen
} from "lucide-react"

// 8 categorías simplificadas
type TicketCategory = 
    | "SERVICE_COMPLAINT"
    | "SUPPORT"
    | "CONSULTING"
    | "DEVELOPMENT"
    | "INFRASTRUCTURE"
    | "NETWORK"
    | "ACCOUNTING"
    | "OTHER"

interface CategoryBadgeProps {
    category: TicketCategory | string | null | undefined
    showIcon?: boolean
    className?: string
    locale?: string
}

const categoryConfig: Record<string, { 
    label: { es: string; en: string }
    icon: React.ElementType
}> = {
    SERVICE_COMPLAINT: {
        label: { es: "Queja", en: "Complaint" },
        icon: AlertTriangle
    },
    SUPPORT: {
        label: { es: "Soporte", en: "Support" },
        icon: Headphones
    },
    CONSULTING: {
        label: { es: "Consultoría", en: "Consulting" },
        icon: GraduationCap
    },
    DEVELOPMENT: {
        label: { es: "Desarrollo", en: "Development" },
        icon: Code
    },
    INFRASTRUCTURE: {
        label: { es: "Infraestructura", en: "Infrastructure" },
        icon: Server
    },
    NETWORK: {
        label: { es: "Redes", en: "Network" },
        icon: Network
    },
    ACCOUNTING: {
        label: { es: "Contabilidad", en: "Accounting" },
        icon: Calculator
    },
    OTHER: {
        label: { es: "Otro", en: "Other" },
        icon: FolderOpen
    }
}

export function CategoryBadge({ category, showIcon = true, className, locale = 'es' }: CategoryBadgeProps) {
    const cat = (category || "OTHER") as string
    const config = categoryConfig[cat] || categoryConfig.OTHER
    const Icon = config.icon
    const label = config.label[locale as 'es' | 'en'] || config.label.es

    return (
        <Badge 
            variant="secondary"
            className={cn(
                "gap-1 text-xs font-medium bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
                className
            )}
        >
            {showIcon && <Icon className="h-3 w-3" />}
            {label}
        </Badge>
    )
}

