/**
 * Servicio de limitación de tasa
 * Limitación de tasa en memoria usando algoritmo de ventana deslizante
 *
 * Características:
 * - Sin dependencias externas (funciona sin Redis/Upstash)
 * - Límites configurables por tipo de acción
 * - Limpieza automática de entradas expiradas
 * - Fácil de migrar a Upstash después
 */

type RateLimitEntry = {
  timestamps: number[];
};

// Configuraciones de límite de tasa
export const RATE_LIMITS = {
  auth: { requests: 5, windowMs: 60 * 1000 }, // 5 intentos por minuto
  register: { requests: 3, windowMs: 60 * 1000 }, // 3 registros por minuto
  otp: { requests: 3, windowMs: 5 * 60 * 1000 }, // 3 peticiones OTP por 5 minutos
  ticket: { requests: 10, windowMs: 60 * 1000 }, // 10 tickets por minuto
  api: { requests: 100, windowMs: 60 * 1000 }, // 100 llamadas API por minuto
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

// Almacén en memoria (usar Map para búsquedas O(1))
const store = new Map<string, RateLimitEntry>();

// Intervalo de limpieza (corre cada 5 minutos para eliminar entradas expiradas)
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const maxWindow = Math.max(
      ...Object.values(RATE_LIMITS).map((r) => r.windowMs)
    );

    for (const [key, entry] of store.entries()) {
      // Eliminar entradas más viejas que la ventana más larga
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < maxWindow);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000); // Cada 5 minutos
}

// Iniciar limpieza cuando carga el módulo
if (typeof window === "undefined") {
  startCleanup();
}

/**
 * Verificar si una petición debe ser limitada
 *
 * @param identifier - Identificador único (email, IP, userId)
 * @param type - Tipo de límite de tasa a aplicar
 * @returns Objeto con estado de éxito e información restante
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType
): {
  success: boolean;
  remaining: number;
  resetMs: number;
  message?: string;
} {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  // Obtener o crear entrada
  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Eliminar marcas de tiempo fuera de la ventana
  entry.timestamps = entry.timestamps.filter(
    (ts) => now - ts < config.windowMs
  );

  // Verificar límite
  if (entry.timestamps.length >= config.requests) {
    const oldestTimestamp = entry.timestamps[0];
    const resetMs = oldestTimestamp + config.windowMs - now;
    const resetSeconds = Math.ceil(resetMs / 1000);

    return {
      success: false,
      remaining: 0,
      resetMs,
      message: `Demasiados intentos. Intenta de nuevo en ${resetSeconds} segundos.`,
    };
  }

  // Registrar esta petición
  entry.timestamps.push(now);

  return {
    success: true,
    remaining: config.requests - entry.timestamps.length,
    resetMs: config.windowMs,
  };
}

/**
 * Reiniciar límite de tasa para un identificador específico
 * Útil después de autenticación exitosa
 */
export function resetRateLimit(identifier: string, type: RateLimitType): void {
  const key = `${type}:${identifier}`;
  store.delete(key);
}

/**
 * Obtener estado actual de límite de tasa sin incrementar
 */
export function getRateLimitStatus(
  identifier: string,
  type: RateLimitType
): { current: number; limit: number; remaining: number } {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry) {
    return { current: 0, limit: config.requests, remaining: config.requests };
  }

  // Contar solo marcas de tiempo válidas
  const validTimestamps = entry.timestamps.filter(
    (ts) => now - ts < config.windowMs
  );
  const current = validTimestamps.length;

  return {
    current,
    limit: config.requests,
    remaining: Math.max(0, config.requests - current),
  };
}

/**
 * Ayudante middleware para obtener identificador desde encabezados
 * Usa X-Forwarded-For para peticiones proxied, recurre a un defecto
 */
export function getClientIdentifier(headers: Headers): string {
  // Probar X-Forwarded-For (común en entornos proxied)
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Probar X-Real-IP
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Respaldo para desarrollo
  return "unknown";
}
