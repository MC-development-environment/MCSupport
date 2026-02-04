/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer, { type SentMessageInfo } from "nodemailer";
import { logger } from "@/infrastructure/logging/logger";

// Constante de respaldo para URL base
export const BASE_URL =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

// Transportador SMTP de Gmail
// Para Gmail: Usar Contraseña de Aplicación (no contraseña regular)
// Ver: https://support.google.com/accounts/answer/185833
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Configuraciones específicas de Gmail para confiabilidad
  tls: {
    rejectUnauthorized: true,
  },
});

/**
 * Valida un email individual
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Intenta enviar un email con lógica de reintento
 */
async function sendEmailWithRetry(
  mailOptions: nodemailer.SendMailOptions,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<SentMessageInfo> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      if (attempt > 1) {
        logger.info(`Email sent successfully on retry attempt ${attempt}`);
      }
      return info;
    } catch (error: any) {
      lastError = error;

      // No reintentar si es restricción permanente de Resend (Error 450)
      if (
        error?.response?.includes("450") &&
        error?.response?.includes("testing emails")
      ) {
        logger.warn(
          `Resend 450 error detected. Aborting retries to allow auto-fix.`
        );
        throw error; // Fallar rápido para que el bloque catch de abajo pueda manejarlo
      }

      logger.warn(`Email send attempt ${attempt}/${maxRetries} failed`, {
        error,
      });

      if (attempt < maxRetries) {
        // Retroceso exponencial
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export async function sendEmail({
  to,
  cc = [],
  subject,
  body,
}: {
  to: string;
  cc?: string[];
  subject: string;
  body: string;
}) {
  // Validación de entrada
  if (!to || !validateEmail(to)) {
    logger.error("Invalid 'to' email address", { to });
    return { success: false, error: "Invalid recipient email address" };
  }

  // Validar CC emails
  const validCcEmails = cc.filter(validateEmail);
  if (cc.length > 0 && validCcEmails.length !== cc.length) {
    logger.warn("Some CC emails were invalid and filtered out", {
      original: cc,
      valid: validCcEmails,
    });
  }

  // Límite razonable de CC emails (anti-spam)
  const MAX_CC_RECIPIENTS = 20;
  if (validCcEmails.length > MAX_CC_RECIPIENTS) {
    logger.error(`Too many CC recipients: ${validCcEmails.length}`, { cc });
    return {
      success: false,
      error: `Maximum ${MAX_CC_RECIPIENTS} CC recipients allowed`,
    };
  }

  // Verificar si SMTP está configurado
  const missingVars = [];
  if (!process.env.SMTP_HOST) missingVars.push("SMTP_HOST");
  if (!process.env.SMTP_USER) missingVars.push("SMTP_USER");
  if (!process.env.SMTP_PASS) missingVars.push("SMTP_PASS");

  if (missingVars.length > 0) {
    logger.warn(
      `SMTP credentials missing: ${missingVars.join(
        ", "
      )}. Falling back to mock email service.`
    );
    console.log("---------------------------------------------------------");
    console.log(`[EMAIL MOCK] To: ${to}`);
    if (validCcEmails.length > 0) {
      console.log(`[EMAIL MOCK] CC: ${validCcEmails.join(", ")}`);
    }
    console.log(`[EMAIL MOCK] Subject: ${subject}`);
    console.log(`[EMAIL MOCK] Body Preview: ${body.substring(0, 100)}...`);
    console.log("---------------------------------------------------------");
    return { success: true, mock: true };
  }

  // Definir mailOptions fuera del bloque try para ser accesible en catch
  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.SMTP_FROM || '"MC Support" <no-reply@mcsupport.com>',
    to,
    subject,
    text: body.replace(/<[^>]*>/g, ""), // Eliminar HTML para respaldo en texto plano
    html: body, // Asumir que el cuerpo ya es HTML
    headers: {
      "X-Priority": "3",
      "X-Mailer": "MC Support System",
      "X-Application": "NetSuite Support Portal",
    },
  };

  // Agregar CC si se proporciona y es válido
  if (validCcEmails.length > 0) {
    mailOptions.cc = validCcEmails.join(", ");
  }

  try {
    const info = await sendEmailWithRetry(mailOptions, 3, 1000);

    logger.info(`Email sent successfully`, {
      messageId: info.messageId,
      to,
      ccCount: validCcEmails.length,
      subject,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    logger.error("Failed to send email after all retries", {
      error,
      to,
      ccCount: validCcEmails.length,
      subject,
    });
    return {
      success: false,
      error: "Failed to send email after multiple attempts",
    };
  }
}
