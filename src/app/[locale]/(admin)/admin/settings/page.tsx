import { getTranslations } from "next-intl/server";
import { getSystemConfig } from "@/common/actions/settings-actions";
import { SettingsForm } from "@/components/admin/settings-form";
import { ProfileForm } from "@/components/admin/profile-form";
import { TwoFactorSetup } from "@/components/settings/two-factor-setup";
import { VacationToggle } from "@/components/admin/vacation-toggle";
import { AutomatedReportsSettings } from "@/components/admin/settings/automated-reports-settings";
import { prisma } from "@/infrastructure/db/prisma";
import { auth } from "@/core/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
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
    slaLow: config.slaLow,
    slaMedium: config.slaMedium,
    slaHigh: config.slaHigh,
    slaCritical: config.slaCritical,
    workDays: config.workDays,
  };

  const fullAccessRoles = ["ROOT", "ADMIN", "MANAGER"];
  const isManager = fullAccessRoles.includes(session.user.role || "");
  const isInternalUser = session.user.role !== "CLIENT";

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{tAdmin("settingsTitle")}</h1>
        <p className="text-muted-foreground">
          {tAdmin("settingsDesc") || tAdmin("profileDesc")}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">{tAdmin("profileInfo")}</TabsTrigger>
          <TabsTrigger value="security">{tAdmin("security")}</TabsTrigger>
          {isManager && (
            <TabsTrigger value="system">{tAdmin("systemConfig")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{tAdmin("profileInfo")}</CardTitle>
              <CardDescription>{tAdmin("profileDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm user={session.user} />
            </CardContent>
          </Card>

          {/* Modo Vacaciones - Solo para usuarios internos */}
          {isInternalUser && <VacationToggle />}
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <TwoFactorSetup />
          </div>
        </TabsContent>

        {isManager && (
          <TabsContent value="system" className="space-y-6">
            <SettingsForm initialData={initialData} />

            <AutomatedReportsSettings
              initialConfig={config}
              availableUsers={await prisma.user.findMany({
                where: { role: { not: "CLIENT" } },
                select: { id: true, name: true, email: true, role: true },
              })}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
