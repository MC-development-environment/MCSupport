"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateReportSettings } from "@/common/actions/settings-actions";

// Schema de validación
const reportConfigSchema = z.object({
  automatedReportsEnabled: z.boolean(),
  reportFrequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "ANNUAL"]),
  reportRecipients: z.array(z.string()), // Array de IDs
});

type ReportConfigDisplay = z.infer<typeof reportConfigSchema>;

interface UserOption {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export function AutomatedReportsSettings({
  initialConfig,
  availableUsers,
}: {
  initialConfig: any;
  availableUsers: UserOption[];
}) {
  const t = useTranslations("Admin.Settings");
  const [isSaving, setIsSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const form = useForm<ReportConfigDisplay>({
    resolver: zodResolver(reportConfigSchema),
    defaultValues: {
      automatedReportsEnabled: initialConfig.automatedReportsEnabled || false,
      reportFrequency: initialConfig.reportFrequency || "WEEKLY",
      reportRecipients: initialConfig.reportRecipients || [],
    },
  });

  const selectedRecipientIds = form.watch("reportRecipients");

  // Filtrar usuarios disponibles para agregar
  const filteredUsers = availableUsers.filter(
    (u) =>
      !selectedRecipientIds.includes(u.id) &&
      (u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  async function onSubmit(data: ReportConfigDisplay) {
    setIsSaving(true);
    try {
      // Llamada al Server Action para configuracion de reportes
      const result = await updateReportSettings({
        id: initialConfig.id,
        ...data,
      });

      if (result.success) {
        toast.success(t("notificationsSaved")); // Reusamos mensaje
      } else {
        toast.error("Error saving settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Unexpected error");
    } finally {
      setIsSaving(false);
    }
  }

  const addRecipient = (userId: string) => {
    const current = form.getValues("reportRecipients");
    form.setValue("reportRecipients", [...current, userId], {
      shouldDirty: true,
    });
  };

  const removeRecipient = (userId: string) => {
    const current = form.getValues("reportRecipients");
    form.setValue(
      "reportRecipients",
      current.filter((id) => id !== userId),
      { shouldDirty: true }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes Automatizados</CardTitle>
        <CardDescription>
          Configura el envío periódico de estadísticas de rendimiento por correo
          electrónico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="automatedReportsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Habilitar Reportes
                    </FormLabel>
                    <FormDescription>
                      Si está activo, el sistema enviará correos automáticos
                      según la frecuencia.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("automatedReportsEnabled") && (
              <>
                <FormField
                  control={form.control}
                  name="reportFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frecuencia de Envío</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione frecuencia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DAILY">
                            Diario (Todos los días 9 AM)
                          </SelectItem>
                          <SelectItem value="WEEKLY">
                            Semanal (Lunes 9 AM)
                          </SelectItem>
                          <SelectItem value="MONTHLY">
                            Mensual (Día 1 del mes)
                          </SelectItem>
                          <SelectItem value="ANNUAL">
                            Anual (1 de Enero)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormLabel>Destinatarios</FormLabel>
                  <FormDescription>
                    Usuarios que recibirán el reporte. Managers recibirán datos
                    de su depto, técnicos sus datos personales.
                  </FormDescription>

                  {/* Lista de Seleccionados */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedRecipientIds.map((id) => {
                      const user = availableUsers.find((u) => u.id === id);
                      return user ? (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="pl-2 pr-1 py-1 flex items-center gap-1"
                        >
                          {user.name || user.email} ({user.role})
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-transparent"
                            onClick={() => removeRecipient(id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ) : null;
                    })}
                  </div>

                  {/* Buscador y Selector */}
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Buscar usuario..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>

                  <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto space-y-1">
                    {filteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No se encontraron usuarios
                      </p>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between text-sm p-2 hover:bg-accent rounded-sm"
                        >
                          <div>
                            <p className="font-medium">
                              {user.name || "Sin nombre"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email} • {user.role}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            onClick={() => addRecipient(user.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Agregar
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
