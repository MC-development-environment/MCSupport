"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limiter";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function authenticate(values: any) {
  const t = await getTranslations("Login");

  // Verificación de límite de tasa
  const rateCheck = checkRateLimit(values.email, "auth");
  if (!rateCheck.success) {
    return { error: rateCheck.message };
  }

  // 1. Pre-verificación para 2FA
  // Solo si aún no tenemos código
  if (!values.code) {
    const user = await prisma.user.findUnique({
      where: { email: values.email },
    });

    if (user && user.twoFactorEnabled) {
      // Verificar contraseña manualmente para evitar enumeración de UI
      const passwordMatch = await compare(values.password, user.password || "");

      if (passwordMatch) {
        // Reiniciar límite de tasa en contraseña exitosa (2FA pendiente)
        resetRateLimit(values.email, "auth");
        return { twoFactor: true, userId: user.id };
      }
    }
  }

  try {
    await signIn("credentials", {
      email: values.email,
      password: values.password,
      code: values.code,
      redirect: false,
    });
    // Reiniciar límite de tasa en inicio de sesión exitoso
    resetRateLimit(values.email, "auth");
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: t("invalidCredentials") };
        default:
          return { error: t("error") };
      }
    }
    throw error;
  }
}

const RegisterSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export async function register(values: z.infer<typeof RegisterSchema>) {
  // Verificación de límite de tasa
  const rateCheck = checkRateLimit(values.email, "register");
  if (!rateCheck.success) {
    return { error: rateCheck.message };
  }

  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Campos inválidos" };
  }

  const { email, password, name } = validatedFields.data;

  // Validación de complejidad de contraseña
  const { validatePassword } = await import("@/lib/password-validator");
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return {
      error: passwordValidation.errors.join(". "),
      passwordErrors: passwordValidation.errors,
      passwordStrength: passwordValidation.strength,
    };
  }

  if (!email.endsWith("@multicomputos.com")) {
    return { error: "Solo se permiten correos de @multicomputos.com" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: "El correo ya está registrado" };
  }

  const hashedPassword = await hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "TECHNICIAN", // Rol por defecto para registros internos
    },
  });

  // Reiniciar límite de tasa en registro exitoso
  resetRateLimit(values.email, "register");

  return { success: "Usuario creado exitosamente!" };
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
