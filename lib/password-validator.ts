/**
 * Servicio de validación de contraseña
 *
 * Provee validación de complejidad de contraseña siguiendo mejores prácticas de seguridad:
 * - Requisito de longitud mínima
 * - Requisitos de tipo de caracteres (mayúsculas, minúsculas, números, caracteres especiales)
 * - Lista negra de contraseñas comunes
 * - Puntuación de fortaleza de contraseña
 */

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0-100
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength: number;
}

// Política de contraseña por defecto
export const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional but recommended
};

// Contraseñas comunes para rechazar (top 100 más comunes)
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
  "admin",
  "login",
  "princess",
  "sunshine",
  "passw0rd",
  "shadow",
  "ashley",
  "football",
  "baseball",
  "iloveyou",
  "trustno1",
  "hello",
  "charlie",
  "donald",
  "password1!",
  "qwerty123",
  "admin123",
  "root",
  "1234567",
  "123456789",
  "1234567890",
  "000000",
  "111111",
  "access",
  "flower",
  "hottie",
  "loveme",
  "zaq1zaq1",
  "qwertyuiop",
  "user",
  "guest",
  "test",
  "demo",
]);

// Caracteres especiales permitidos
const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Validar una contraseña contra la política
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_POLICY
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Verificar si la contraseña existe
  if (!password || password.trim().length === 0) {
    return {
      valid: false,
      score: 0,
      errors: ["La contraseña es requerida"],
      strength: "weak",
    };
  }

  // Recortar y verificar longitud
  const pwd = password.trim();

  // Longitud mínima
  if (pwd.length < policy.minLength) {
    errors.push(`Mínimo ${policy.minLength} caracteres`);
  } else {
    score += 20;
    if (pwd.length >= 12) score += 10;
    if (pwd.length >= 16) score += 10;
  }

  // Longitud máxima
  if (pwd.length > policy.maxLength) {
    errors.push(`Máximo ${policy.maxLength} caracteres`);
  }

  // Requisito de mayúsculas
  if (policy.requireUppercase) {
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Incluir al menos una letra mayúscula");
    } else {
      score += 15;
    }
  }

  // Requisito de minúsculas
  if (policy.requireLowercase) {
    if (!/[a-z]/.test(pwd)) {
      errors.push("Incluir al menos una letra minúscula");
    } else {
      score += 15;
    }
  }

  // Requisito de números
  if (policy.requireNumbers) {
    if (!/[0-9]/.test(pwd)) {
      errors.push("Incluir al menos un número");
    } else {
      score += 15;
    }
  }

  // Requisito de caracteres especiales
  if (policy.requireSpecialChars) {
    if (!SPECIAL_CHARS.test(pwd)) {
      errors.push("Incluir al menos un carácter especial (!@#$%^&*)");
    } else {
      score += 15;
    }
  } else if (SPECIAL_CHARS.test(pwd)) {
    // Bono si se usan caracteres especiales aunque no sean requeridos
    score += 10;
  }

  // Verificar contraseñas comunes
  if (COMMON_PASSWORDS.has(pwd.toLowerCase())) {
    errors.push("Esta contraseña es muy común");
    score = Math.max(0, score - 30);
  }

  // Verificar caracteres repetidos (ej., "aaaa")
  if (/(.)\1{3,}/.test(pwd)) {
    errors.push("Evitar caracteres repetidos consecutivos");
    score = Math.max(0, score - 10);
  }

  // Verificar caracteres secuenciales (ej., "1234", "abcd")
  if (hasSequentialChars(pwd)) {
    score = Math.max(0, score - 10);
  }

  // Limitar puntuación a 100
  score = Math.min(100, score);

  // Determinar fortaleza
  let strength: "weak" | "fair" | "good" | "strong";
  if (score < 40) {
    strength = "weak";
  } else if (score < 60) {
    strength = "fair";
  } else if (score < 80) {
    strength = "good";
  } else {
    strength = "strong";
  }

  return {
    valid: errors.length === 0,
    score,
    errors,
    strength,
  };
}

/**
 * Verificar caracteres secuenciales como "123" o "abc"
 */
function hasSequentialChars(password: string): boolean {
  const sequences = [
    "0123456789",
    "abcdefghijklmnopqrstuvwxyz",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];

  const lower = password.toLowerCase();

  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const forward = seq.slice(i, i + 4);
      const backward = forward.split("").reverse().join("");
      if (lower.includes(forward) || lower.includes(backward)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Obtener etiqueta de fortaleza de contraseña para UI
 */
export function getStrengthLabel(
  strength: PasswordValidationResult["strength"]
): {
  label: string;
  color: string;
} {
  switch (strength) {
    case "weak":
      return { label: "Débil", color: "red" };
    case "fair":
      return { label: "Regular", color: "orange" };
    case "good":
      return { label: "Buena", color: "yellow" };
    case "strong":
      return { label: "Fuerte", color: "green" };
  }
}

/**
 * Generar texto de requisitos de contraseña para UI
 */
export function getPasswordRequirements(
  policy: PasswordPolicy = DEFAULT_POLICY
): string[] {
  const requirements: string[] = [];

  requirements.push(`Mínimo ${policy.minLength} caracteres`);

  if (policy.requireUppercase) {
    requirements.push("Al menos una letra mayúscula (A-Z)");
  }
  if (policy.requireLowercase) {
    requirements.push("Al menos una letra minúscula (a-z)");
  }
  if (policy.requireNumbers) {
    requirements.push("Al menos un número (0-9)");
  }
  if (policy.requireSpecialChars) {
    requirements.push("Al menos un carácter especial (!@#$%^&*)");
  }

  return requirements;
}
