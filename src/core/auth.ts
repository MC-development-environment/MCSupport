import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/infrastructure/db/prisma";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
            code: z.string().optional(),
          })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password, code } = parsedCredentials.data;

          const user = await prisma.user.findUnique({
            where: { email },
            // Necesitamos campos básicos para verificar
          });
          if (!user) return null;
          if (!user.password) return null;

          const passwordsMatch = await compare(password, user.password);
          if (!passwordsMatch) return null;

          // Lógica 2FA
          if (user.twoFactorEnabled) {
            if (!code) return null; // Requerir código si está habilitado

            // Importar dinámicamente para evitar dependencias circulares si las hay,
            // aunque aquí está bien ya que el servicio es lib
            const { TwoFactorService } = await import(
              "@/core/services/two-factor-service"
            );

            // Verificar TOTP
            if (user.twoFactorSecret) {
              // Primero intentar como TOTP normal
              let isValid = TwoFactorService.verifyToken(
                user.twoFactorSecret,
                code
              );

              // Si es inválido, intentar como código de respaldo
              if (!isValid) {
                const backupResult = await TwoFactorService.verifyBackupCode(
                  code,
                  user.backupCodes
                );
                if (
                  backupResult.valid &&
                  backupResult.usedIndex !== undefined
                ) {
                  // Eliminar código de respaldo usado
                  const newCodes = user.backupCodes.filter(
                    (_, i) => i !== backupResult.usedIndex
                  );
                  await prisma.user.update({
                    where: { id: user.id },
                    data: { backupCodes: newCodes },
                  });
                  isValid = true;
                }
              }

              if (!isValid) return null;
            }
          }

          return user;
        }
        return null;
      },
    }),
    Credentials({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            code: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;
        const { email, code } = parsed.data;

        const validOtp = await prisma.loginOTP.findFirst({
          where: {
            email,
            code,
            used: false,
            expiresAt: { gt: new Date() },
          },
        });

        if (!validOtp) return null;

        // Marcar como usado
        await prisma.loginOTP.update({
          where: { id: validOtp.id },
          data: { used: true },
        });

        // Encontrar o Crear Usuario
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              role: "CLIENT",
            },
          });
        }

        return user;
      },
    }),
  ],
});
