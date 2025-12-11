import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import { authConfig } from "./auth.config"

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
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    const user = await prisma.user.findUnique({ where: { email } });
                    if (!user) return null;

                    // If user has no password (e.g. OAuth), they can't login with credentials
                    if (!user.password) return null;

                    const passwordsMatch = await compare(password, user.password);

                    if (passwordsMatch) return user;
                }
                return null;
            },
        }),
        Credentials({
            id: "otp",
            name: "OTP",
            credentials: {
                email: { label: "Email", type: "email" },
                code: { label: "Code", type: "text" }
            },
            async authorize(credentials) {
                const parsed = z.object({
                    email: z.string().email(),
                    code: z.string().min(6)
                }).safeParse(credentials);

                if (!parsed.success) return null;
                const { email, code } = parsed.data;

                const validOtp = await prisma.loginOTP.findFirst({
                    where: {
                        email,
                        code,
                        used: false,
                        expiresAt: { gt: new Date() }
                    }
                });

                if (!validOtp) return null;

                // Mark as used
                await prisma.loginOTP.update({
                    where: { id: validOtp.id },
                    data: { used: true }
                });

                // Find or Create User
                let user = await prisma.user.findUnique({ where: { email } });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email,
                            name: email.split('@')[0],
                            role: 'CLIENT',
                        }
                    });
                }

                return user;
            }
        }),
    ],
})
