import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole } from "@prisma/client";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized() {
      // Manejamos la redirección explícitamente en la función principal de middleware.ts para evitar
      // conflictos con next-intl y asegurar el orden de ejecución correcto.
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // Login inicial - guardar datos de usuario en token
      if (user) {
        token.role = user.role;
        token.name = user.name;
      }

      // Actualización de perfil disparada desde cliente vía update()
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as UserRole;
        session.user.id = token.sub as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // La lógica se maneja en la versión de Node (auth.ts), esto es solo un placeholder de definición
        // O lo definimos aquí si usamos fetch a una API.
        // Pero para override de Prisma, lo dejamos simple aquí.
        // De hecho, en v5, si usamos config separada, el middleware usa ESTA config.
        // Pero la lógica de authorize usualmente necesita BD.
        // El middleware generalmente no verifica credenciales, verifica Sesión.
        // Así que podemos dejar providers vacíos aquí? No, NextAuth necesita providers.
        // Si separamos, el middleware solo necesita la función 'auth' que verifica token de sesión.
        // Solo necesitamos providers VACÍOS o definidos mínimamente aquí para pasar tipos?
        return null;
      },
    }),
  ], // Providers agregados en auth.ts para estrategia completa
} satisfies NextAuthConfig;
