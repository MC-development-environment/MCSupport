"use server";

import { prisma } from "@/lib/prisma";
import { randomInt } from "crypto";
import { addMinutes } from "date-fns";
import { getTranslations } from "next-intl/server";
import { checkRateLimit } from "@/lib/rate-limiter";

// Simulador de envío de correo
async function sendEmail(email: string, code: string) {
  console.log(`[MOCK EMAIL] To: ${email}, Code: ${code}`);
  // En producción, integrar Resend o Nodemailer aquí
  return true;
}

export async function requestOtp(email: string) {
  const t = await getTranslations("Login.Otp");

  // Verificación de límite de tasa - 3 solicitudes OTP cada 5 minutos
  const rateCheck = checkRateLimit(email, "otp");
  if (!rateCheck.success) {
    return { error: rateCheck.message };
  }

  // 1. Verificar si el correo está permitido (Lista blanca)
  // Por ahora, permitir @multicomputos.com o si existe en la tabla AllowedClientEmail.
  // If table is empty, maybe allow all for dev?
  // User Requirement: "solo correos habilitados... lista blanca".
  // I will check the table.

  // ¿Permitir dominio interno para pruebas también? "el cliente solo debe poner su correo".
  // Vamos a implementar verificación estricta.

  /* 
    const allowed = await prisma.allowedClientEmail.findUnique({
        where: { email }
    })
    
    // Also allow existing users with role CLIENT?
    const existingUser = await prisma.user.findUnique({ where: { email } })
    
    if (!allowed && existingUser?.role !== 'CLIENT') {
        return { error: "Correo no autorizado." }
    }
    */

  // Lógica estricta: Debe estar en la lista permitida O ser un usuario existente (quizás creado por integración Netsuite).
  // Vamos a verificar el usuario primero.
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (!existingUser) {
    // Verificar lista blanca
    const allowed = await prisma.allowedClientEmail.findUnique({
      where: { email },
    });
    if (!allowed || !allowed.isActive) {
      return { error: t("emailNotAuthorized") };
    }
  }

  // 2. Generar código
  const code = randomInt(100000, 999999).toString();
  const expiresAt = addMinutes(new Date(), 15); // 15 min de validez

  // 3. Guardar en BD
  await prisma.loginOTP.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  // 4. Enviar correo
  await sendEmail(email, code);

  return { success: true, message: t("codeSent") };
}

export async function verifyOtpAction(email: string, code: string) {
  // Esta acción actúa como una verificación previa o alternativa a signIn si es necesario,
  // pero la creación real de la sesión ocurre en el proveedor 'auth.ts'.
  // Podemos usar esto para validar y luego llamar a signIn en el cliente.

  const validOtp = await prisma.loginOTP.findFirst({
    where: {
      email,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!validOtp) {
    return { success: false };
  }

  return { success: true };
}
