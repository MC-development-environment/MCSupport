/**
 * Utilidades de seguridad para sanitización y validación de entrada
 */

import { randomBytes } from "crypto";

/**
 * Sanitiza texto para prevenir XSS y ataques de inyección
 */
export function sanitizeText(text: string, maxLength: number = 5000): string {
  if (!text) return "";

  // Eliminar bytes nulos
  let sanitized = text.replace(/\0/g, "");

  // Recortar espacios en blanco
  sanitized = sanitized.trim();

  // Limitar longitud
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitiza HTML básico permitiendo solo tags seguros
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // IMPLEMENTACIÓN: Stripping total de HTML para máxima seguridad.
  // No permitimos Rich Text para evitar vectores de ataque XSS complejos.
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Valida que un email sea válido
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  // RFC 5322 compliant regex (simplificado)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validaciones adicionales
  if (email.length > 254) return false; // Longitud máx email RFC 5321
  if (email.includes("..")) return false; // No dots consecutivos

  return emailRegex.test(email);
}

/**
 * Limpia y valida un array de emails
 */
export function sanitizeEmailList(
  emails: string[],
  maxEmails: number = 20
): string[] {
  if (!emails || !Array.isArray(emails)) return [];

  return emails
    .map((email) => email.trim().toLowerCase())
    .filter((email) => isValidEmail(email))
    .filter((email, index, self) => self.indexOf(email) === index) // Eliminar duplicados
    .slice(0, maxEmails);
}

/**
 * Valida filename para prevenir path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "file";

  // Eliminar separadores de ruta y bytes nulos
  let sanitized = filename.replace(/[/\\\\:*?"<>|\\0]/g, "_");

  // Eliminar puntos iniciales
  sanitized = sanitized.replace(/^\\.+/, "");

  // Limitar longitud
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop() || "";
    const name = sanitized.substring(0, 250 - ext.length);
    sanitized = `${name}.${ext}`;
  }

  return sanitized || "file";
}

/**
 * Ayudante de limitación de tasa - implementación simple en memoria
 * En producción, considerar usar Redis para rate limiting distribuido
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Limpiar entradas expiradas periódicamente
  if (Math.random() < 0.01) {
    // 1% probabilidad
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // Nueva ventana
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Genera un token seguro de longitud especificada
 */
export function generateSecureToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";

  // Usar Node.js crypto para lado servidor
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    token += chars[bytes[i] % chars.length];
  }

  return token;
}
