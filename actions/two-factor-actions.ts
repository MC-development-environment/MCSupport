"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TwoFactorService } from "@/lib/two-factor-service";
import { logActivity, AuditAction, AuditEntity } from "@/lib/audit-service";
import { revalidatePath } from "next/cache";
import { compare } from "bcryptjs";
import { ErrorCodes } from "@/lib/error-codes";

/**
 * Inicia el proceso de habilitación de 2FA
 * Retorna el QR code y el secret para configurar el autenticador
 */
export async function initiate2FA() {
  const session = await auth();
  if (!session?.user?.email || !session?.user?.id) {
    return { error: ErrorCodes.UNAUTHORIZED };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  if (user?.twoFactorEnabled) {
    return { error: ErrorCodes.TWO_FA_ALREADY_ENABLED };
  }

  try {
    // Generar secret y QR
    const { secret, otpauthUrl } = TwoFactorService.generateSecret(
      session.user.email!
    );
    const qrCodeDataUrl = await TwoFactorService.generateQRCode(otpauthUrl);

    return {
      success: true,
      secret,
      qrCodeDataUrl,
    };
  } catch (error) {
    console.error("Error initiating 2FA:", error);
    return { error: "Error al inicializar 2FA. Intenta nuevamente." };
  }
}

/**
 * Verifica el código TOTP y habilita 2FA permanentemente
 */
export async function enable2FA(secret: string, token: string) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return { error: ErrorCodes.UNAUTHORIZED };
  }

  // Validar entradas
  if (!secret || !token) {
    return { error: ErrorCodes.TWO_FA_SECRET_REQUIRED };
  }

  // Verificar código TOTP
  const isValid = TwoFactorService.verifyToken(secret, token);
  if (!isValid) {
    return {
      error:
        "Código inválido. Verifica el código en tu aplicación autenticadora.",
    };
  }

  // Verificar que el usuario existe (evitar error de sesión estale)
  const userExists = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!userExists) {
    return {
      error:
        "Usuario no encontrado. Tu sesión puede ser antigua, por favor cierra sesión e ingresa nuevamente.",
    };
  }

  try {
    // Generar códigos de respaldo
    const { codes, hashed } = await TwoFactorService.generateBackupCodes();

    // Guardar en base de datos
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        backupCodes: hashed,
      },
    });

    // Registro de auditoría
    await logActivity(AuditAction.UPDATE, AuditEntity.USER, session.user.id, {
      action: "2fa_enabled",
      email: session.user.email,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/portal/settings");

    return {
      success: true,
      backupCodes: codes,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error enabling 2FA:", error);
    return { error: `Error: ${error.message || "Unknown error"}` };
  }
}

/**
 * Deshabilita 2FA (requiere contraseña para confirmar)
 */
export async function disable2FA(password: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: ErrorCodes.UNAUTHORIZED };
  }

  if (!password) {
    return { error: ErrorCodes.PASSWORD_REQUIRED };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      password: true,
      twoFactorEnabled: true,
      email: true,
    },
  });

  if (!user?.password) {
    return { error: ErrorCodes.TWO_FA_NO_PASSWORD };
  }

  if (!user.twoFactorEnabled) {
    return { error: ErrorCodes.TWO_FA_NOT_ENABLED };
  }

  // Verificar contraseña
  const isValidPassword = await compare(password, user.password);
  if (!isValidPassword) {
    return { error: ErrorCodes.PASSWORD_INCORRECT };
  }

  try {
    // Deshabilitar 2FA
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });

    await logActivity(AuditAction.UPDATE, AuditEntity.USER, session.user.id, {
      action: "2fa_disabled",
      email: user.email,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/portal/settings");

    return { success: true };
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return { error: "Error al deshabilitar 2FA. Intenta nuevamente." };
  }
}

/**
 * Verifica un código 2FA durante el login
 * Soporta tanto códigos TOTP como backup codes
 */
export async function verify2FACode(userId: string, token: string) {
  if (!userId || !token) {
    return { error: ErrorCodes.TWO_FA_SECRET_REQUIRED };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorSecret: true,
      twoFactorEnabled: true,
      backupCodes: true,
      email: true,
    },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return { error: "2FA no habilitado para este usuario" };
  }

  // Limpiar el token (remover espacios)
  const cleanToken = token.replace(/\s/g, "");

  // Intentar verificar como código TOTP (6 dígitos)
  if (cleanToken.length === 6 && /^\d+$/.test(cleanToken)) {
    const isValidTOTP = TwoFactorService.verifyToken(
      user.twoFactorSecret,
      cleanToken
    );
    if (isValidTOTP) {
      await logActivity(AuditAction.UPDATE, AuditEntity.USER, userId, {
        action: "2fa_login_success",
        method: "totp",
        email: user.email,
      });
      return { success: true, method: "totp" };
    }
  }

  // Intentar verificar como código de respaldo
  const backupResult = await TwoFactorService.verifyBackupCode(
    cleanToken,
    user.backupCodes
  );

  if (backupResult.valid && backupResult.usedIndex !== undefined) {
    // Remover el código de respaldo usado
    const updatedCodes = user.backupCodes.filter(
      (_, i) => i !== backupResult.usedIndex
    );

    await prisma.user.update({
      where: { id: userId },
      data: { backupCodes: updatedCodes },
    });

    await logActivity(AuditAction.UPDATE, AuditEntity.USER, userId, {
      action: "2fa_login_success",
      method: "backup",
      remaining: updatedCodes.length,
      email: user.email,
    });

    return {
      success: true,
      method: "backup",
      remaining: updatedCodes.length,
      warning:
        updatedCodes.length === 0
          ? "Último código de respaldo usado"
          : undefined,
    };
  }

  // Código inválido
  await logActivity(AuditAction.UPDATE, AuditEntity.USER, userId, {
    action: "2fa_login_failed",
    email: user.email,
  });

  return { error: ErrorCodes.INVALID_CODE };
}

/**
 * Obtiene el estado actual de 2FA para el usuario
 */
export async function get2FAStatus() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: ErrorCodes.UNAUTHORIZED };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      twoFactorEnabled: true,
      backupCodes: true,
    },
  });

  if (!user) {
    return { error: ErrorCodes.USER_NOT_FOUND };
  }

  return {
    success: true,
    enabled: user.twoFactorEnabled,
    backupCodesRemaining: user.backupCodes.length,
  };
}
