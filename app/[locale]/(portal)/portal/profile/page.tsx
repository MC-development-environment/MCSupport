import { getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/admin/profile-form";
import { TwoFactorSetup } from "@/components/settings/two-factor-setup";
import { auth } from "@/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const tAdmin = await getTranslations("Admin");
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-[800px] mx-auto w-full">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{tAdmin("settingsTitle")}</h2>
            </div>
            
            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile">{tAdmin("profileInfo")}</TabsTrigger>
                    <TabsTrigger value="security">{tAdmin("security")}</TabsTrigger>
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

                <TabsContent value="security">
                    <div className="space-y-6">
                        <TwoFactorSetup />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
