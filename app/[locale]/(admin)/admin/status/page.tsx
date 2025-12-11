import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTranslations } from "next-intl/server"
import { Database, Server, Clock, Activity } from "lucide-react"

export default async function StatusPage() {
    const t = await getTranslations("Admin.Status");
    let dbStatus = "Unknown"
    let latency = 0

    const start = Date.now()
    try {
        await prisma.$queryRaw`SELECT 1`
        dbStatus = "Connected"
        latency = Date.now() - start
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        dbStatus = "Error"
        console.error(e)
    }

    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('database')}</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {dbStatus === "Connected" ? t('connected') : t('error')}
                            <Badge variant={dbStatus === "Connected" ? "default" : "destructive"}>
                                {dbStatus === "Connected" ? t('operational') : t('down')}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('latency')}: {latency}ms
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('environment')}</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{process.env.NODE_ENV || 'development'}</div>
                        <p className="text-xs text-muted-foreground">
                            {t('region')}: Local
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('uptime')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uptimeHours}h {uptimeMinutes}m</div>
                        <p className="text-xs text-muted-foreground">
                            {t('version')}: 0.1.0
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('memory')}</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{memoryMB} MB</div>
                        <p className="text-xs text-muted-foreground">
                            RSS Usage
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
