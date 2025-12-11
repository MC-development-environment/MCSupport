import { getTranslations } from "next-intl/server";
import { getSystemConfig } from "@/actions/settings-actions";
import { SettingsForm } from "@/components/admin/settings-form";
import { ProfileForm } from "@/components/admin/profile-form";
import { auth } from "@/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
    const t = await getTranslations("Admin.Settings");
    const tAdmin = await getTranslations("Admin");
    const session = await auth();
    const config = await getSystemConfig();

    if (!session?.user) return null;

    const initialData = {
        companyName: config.companyName,
        supportEmail: config.supportEmail,
        maintenanceMode: config.maintenanceMode,
        maxUploadSizeMB: config.maxUploadSizeMB,
        allowedFileTypes: config.allowedFileTypes,
        assistantName: config.assistantName,
        assistantEnabled: config.assistantEnabled,
        businessHoursStart: config.businessHoursStart,
        businessHoursEnd: config.businessHoursEnd,
    };

    const isManager = session.user.role === "MANAGER";

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">{tAdmin("settingsTitle")}</h2>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile">{tAdmin("profileInfo")}</TabsTrigger>
                    {isManager && <TabsTrigger value="system">{tAdmin("systemConfig")}</TabsTrigger>}
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>{tAdmin("profileInfo")}</CardTitle>
                            <CardDescription>
                                {tAdmin("profileDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProfileForm user={session.user} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {isManager && (
                    <TabsContent value="system">
                        <SettingsForm initialData={initialData} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
