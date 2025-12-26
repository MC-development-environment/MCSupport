/**
 * Asistente Virtual LAU - Ruta API Cron
 * Endpoint para ejecutar el proceso de seguimiento automático
 *
 * Este endpoint debe ser llamado periódicamente (cada hora) por un cron job externo
 * Ejemplo: https://your-domain.com/api/cron/followup?secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { processAutoFollowup } from "@/lib/lau";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Verificar secret para proteger el endpoint
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (!process.env.CRON_SECRET) {
      logger.warn("[Cron] CRON_SECRET not configured, skipping security check");
    } else if (secret !== process.env.CRON_SECRET) {
      logger.warn("[Cron] Invalid secret provided");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    logger.info("[Cron] Starting auto-followup process");

    const result = await processAutoFollowup();

    logger.info("[Cron] Auto-followup completed", result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("[Cron] Error in auto-followup", { error });
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// También permitir POST para servicios de cron que prefieren POST
export async function POST(request: NextRequest) {
  return GET(request);
}
