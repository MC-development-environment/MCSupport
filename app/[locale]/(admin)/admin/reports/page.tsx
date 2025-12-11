import { getTranslations } from 'next-intl/server';
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function ReportsPage() {
    const t = await getTranslations('Admin.Reports');

    const periods = [
        { key: 'daily', label: t('daily') },
        { key: 'weekly', label: t('weekly') },
        { key: 'monthly', label: t('monthly') },
        { key: 'yearly', label: t('yearly') },
    ];

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>

                {/* Sophisticated Export Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <FileDown className="h-4 w-4" />
                            {t('download')}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Seleccionar Periodo</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {periods.map((period) => (
                            <DropdownMenuItem key={period.key} asChild>
                                <a href={`/api/admin/reports?period=${period.key}`} target="_blank" rel="noopener noreferrer" className="w-full cursor-pointer flex items-center">
                                    {period.label} (CSV)
                                </a>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Interactive Dashboard */}
            <AnalyticsDashboard />
        </div>
    )
}
