import { Badge } from "@/components/ui/badge"
import { Smile, Meh, Frown } from "lucide-react"
import { useTranslations } from "next-intl"

interface SentimentBadgeProps {
    sentiment: string | null; // Using string to avoid type errors before prisma generate
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
    const t = useTranslations('Enums.Sentiment');

    // Default to NEUTRAL if null
    const currentSentiment = sentiment || 'NEUTRAL';

    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let Icon = Meh;
    let colorClass = "text-muted-foreground";

    // Using raw strings to match Prisma Enum
    switch (currentSentiment) {
        case 'POSITIVE':
            variant = "outline"; // Using outline but styled with green
            Icon = Smile;
            colorClass = "text-green-600 border-green-600 bg-green-50";
            break;
        case 'NEGATIVE':
            variant = "destructive";
            Icon = Frown;
            colorClass = ""; // Destructive handles it
            break;
        case 'NEUTRAL':
        default:
            variant = "secondary";
            Icon = Meh;
            colorClass = "text-muted-foreground";
            break;
    }

    return (
        <Badge variant={variant} className={`gap-1 ${colorClass}`}>
            <Icon className="h-3 w-3" />
            {t(currentSentiment as any)}
        </Badge>
    )
}
