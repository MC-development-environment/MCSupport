"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  supportEmail: z.string().email("Invalid email address"),
  maintenanceMode: z.boolean(),
  maxUploadSizeMB: z.coerce.number().min(1).max(50),
  allowedFileTypes: z.string().min(1, "Allowed file types are required"),
  assistantName: z.string().min(1, "Assistant name is required"),
  assistantEnabled: z.boolean(),
  businessHoursStart: z.coerce.number().min(0).max(23),
  businessHoursEnd: z.coerce.number().min(0).max(23),
  slaLow: z.coerce.number().min(1),
  slaMedium: z.coerce.number().min(1),
  slaHigh: z.coerce.number().min(1),
  slaCritical: z.coerce.number().min(1),
  workDays: z.array(z.string()),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

export async function getSystemConfig() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Encontrar la primera configuración o crear por defecto
  let config = await prisma.systemConfig.findFirst();

  if (!config) {
    config = await prisma.systemConfig.create({
      data: {
        companyName: "Multicomputos",
        supportEmail: "support@multicomputos.com",
        maintenanceMode: false,
        maxUploadSizeMB: 5,
        allowedFileTypes: ".jpg,.png,.pdf,.doc,.docx",
        assistantName: "LAU",
        assistantEnabled: true,
        businessHoursStart: 9,
        businessHoursEnd: 18,
      },
    });
  }

  // Retornar con valores por defecto si faltan campos (ej. registros antiguos)
  return {
    ...config,
    assistantName: config.assistantName ?? "LAU",
    assistantEnabled: config.assistantEnabled ?? true,
    businessHoursStart: config.businessHoursStart ?? 9,
    businessHoursEnd: config.businessHoursEnd ?? 18,
    slaLow: config.slaLow ?? 48,
    slaMedium: config.slaMedium ?? 24,
    slaHigh: config.slaHigh ?? 8,
    slaCritical: config.slaCritical ?? 4,
    workDays: config.workDays ?? ["1", "2", "3", "4", "5"],
  };
}

export async function updateSystemConfig(data: SettingsFormData) {
  const session = await auth();

  if (!session || session.user.role !== "MANAGER") {
    return { error: "Unauthorized" };
  }

  const result = settingsSchema.safeParse(data);
  if (!result.success) {
    return { error: "Invalid data" };
  }

  try {
    const currentConfig = await prisma.systemConfig.findFirst();

    if (currentConfig) {
      await prisma.systemConfig.update({
        where: { id: currentConfig.id },
        data: {
          ...result.data,
          updatedBy: session.user.email,
        },
      });
    } else {
      await prisma.systemConfig.create({
        data: {
          ...result.data,
          updatedBy: session.user.email,
        },
      });
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { error: "Failed to update settings" };
  }
}
