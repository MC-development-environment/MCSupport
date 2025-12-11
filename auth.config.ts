import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            // We handle redirection explicitly in middleware.ts main function to avoid
            // conflict with next-intl and ensure correct execution order.
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string
                session.user.id = token.sub as string
            }
            return session
        }
    },
    providers: [
        Credentials({
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // Logic handled in the Node version (auth.ts), this is just definition placeholder 
                // OR we define it here if we use fetch to an API. 
                // But for Prisma override, we leave it simple here? 
                // Actually, in v5, if we use separate config, the middleware uses THIS config.
                // But authorize logic usually needs DB. 
                // Middleware generally doesn't check credentials, it checks Session.
                // So we can keep providers empty here? No, NextAuth needs providers.
                // If we split, middleware only needs 'auth' function which verifies session token.
                // We just need EMPTY providers or minimally defined here for types to pass?
                return null;
            }
        })
    ], // Providers added in auth.ts for full strategy
} satisfies NextAuthConfig
