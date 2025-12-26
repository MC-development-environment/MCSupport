"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateSystemConfig } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";

// Definición de esquema coincidente con el del servidor
const settingsSchema = z.object({
    companyName: z.string().min(1),
    supportEmail: z.string().email(),
    maintenanceMode: z.boolean(),
    // Usar z.number() pero manejar entrada de cadena vía coerce o pre-procesamiento si es necesario
    // más simple para el formulario usar coerce
    maxUploadSizeMB: z.coerce.number().min(1).max(50),
    allowedFileTypes: z.string().min(1),
    assistantName: z.string().min(1),
    assistantEnabled: z.boolean(),
    businessHoursStart: z.coerce.number().min(0).max(23),
    businessHoursEnd: z.coerce.number().min(0).max(23),
    // Configuración de SLA
    slaLow: z.coerce.number().min(1),
    slaMedium: z.coerce.number().min(1),
    slaHigh: z.coerce.number().min(1),
    slaCritical: z.coerce.number().min(1),
    workDays: z.array(z.string()), // ej. ["1", "2"]
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
    initialData: SettingsFormData;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
    const t = useTranslations("Admin.Settings");
    const [isPending, startTransition] = useTransition();

    const form = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: initialData,
    });

    const onSubmit = (data: SettingsFormData) => {
        startTransition(async () => {
            try {
                const result = await updateSystemConfig(data);
                if (result.error) {
                    toast.error(t("error"));
                } else {
                    toast.success(t("success"));
                }
            } catch {
                toast.error(t("error"));
            }
        });
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t("title")}</CardTitle>
                    <CardDescription>
                        {t("companyName")}, {t("supportEmail")}, etc.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">{t("companyName")}</Label>
                                <Input
                                    id="companyName"
                                    {...form.register("companyName")}
                                    disabled={isPending}
                                />
                                {form.formState.errors.companyName && (
                                    <p className="text-sm text-red-500">
                                        {form.formState.errors.companyName.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="supportEmail">{t("supportEmail")}</Label>
                                <Input
                                    id="supportEmail"
                                    type="email"
                                    {...form.register("supportEmail")}
                                    disabled={isPending}
                                />
                                {form.formState.errors.supportEmail && (
                                    <p className="text-sm text-red-500">
                                        {form.formState.errors.supportEmail.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maxUploadSizeMB">{t("maxUploadSize")}</Label>
                                <Input
                                    id="maxUploadSizeMB"
                                    type="number"
                                    {...form.register("maxUploadSizeMB")}
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="allowedFileTypes">{t("allowedFileTypes")}</Label>
                                <Input
                                    id="allowedFileTypes"
                                    {...form.register("allowedFileTypes")}
                                    disabled={isPending}
                                    placeholder=".jpg,.png"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="assistantName">{t("assistantName")}</Label>
                                <Input
                                    id="assistantName"
                                    {...form.register("assistantName")}
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 rounded-lg border p-4">
                            <Switch
                                id="maintenanceMode"
                                checked={form.watch("maintenanceMode")}
                                onCheckedChange={(checked) =>
                                    form.setValue("maintenanceMode", checked)
                                }
                                disabled={isPending}
                            />
                            <div className="space-y-0.5">
                                <Label htmlFor="maintenanceMode">{t("maintenanceMode")}</Label>
                                <p className="text-sm text-muted-foreground">
                                    {t("maintenanceModeDesc")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 rounded-lg border p-4">
                            <Switch
                                id="assistantEnabled"
                                checked={form.watch("assistantEnabled")}
                                onCheckedChange={(checked) =>
                                    form.setValue("assistantEnabled", checked)
                                }
                                disabled={isPending}
                            />
                            <div className="space-y-0.5">
                                <Label htmlFor="assistantEnabled">{t("assistantEnabled")}</Label>
                                <p className="text-sm text-muted-foreground">
                                    {t("assistantDesc")}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <h3 className="md:col-span-2 text-lg font-medium">{t("businessHours")}</h3>
                            <div className="space-y-2">
                                <Label htmlFor="businessHoursStart">{t("businessHoursStart")}</Label>
                                <Input
                                    id="businessHoursStart"
                                    type="number"
                                    min={0}
                                    max={23}
                                    {...form.register("businessHoursStart")}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="businessHoursEnd">{t("businessHoursEnd")}</Label>
                                <Input
                                    id="businessHoursEnd"
                                    type="number"
                                    min={0}
                                    max={23}
                                    {...form.register("businessHoursEnd")}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>{t("workDays")}</Label>
                                <div className="flex gap-4 flex-wrap">
                                    {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                                        <div key={day} className="flex items-center space-x-2">
                                            <Switch
                                                checked={form.watch("workDays")?.includes(String(day))}
                                                onCheckedChange={(checked) => {
                                                    const current = form.watch("workDays") || [];
                                                    if (checked) {
                                                        form.setValue("workDays", [...current, String(day)]);
                                                    } else {
                                                        form.setValue(
                                                            "workDays",
                                                            current.filter((d) => d !== String(day))
                                                        );
                                                    }
                                                }}
                                                disabled={isPending}
                                            />
                                            <Label className="font-normal">
                                                {new Date(2024, 0, day === 0 ? 7 : day).toLocaleDateString("es-ES", { weekday: "long" })}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <h3 className="md:col-span-2 text-lg font-medium">{t("slaTitle")}</h3>
                            <p className="md:col-span-2 text-sm text-muted-foreground -mt-2 mb-2">{t("slaDesc")}</p>
                            
                            <div className="space-y-2">
                                <Label htmlFor="slaLow">{t("slaLow")}</Label>
                                <Input
                                    id="slaLow"
                                    type="number"
                                    {...form.register("slaLow")}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slaMedium">{t("slaMedium")}</Label>
                                <Input
                                    id="slaMedium"
                                    type="number"
                                    {...form.register("slaMedium")}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slaHigh">{t("slaHigh")}</Label>
                                <Input
                                    id="slaHigh"
                                    type="number"
                                    {...form.register("slaHigh")}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slaCritical">{t("slaCritical")}</Label>
                                <Input
                                    id="slaCritical"
                                    type="number"
                                    {...form.register("slaCritical")}
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("saving")}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {t("save")}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
