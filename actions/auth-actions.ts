"use server"

import { signIn, signOut } from "@/auth"
import { AuthError } from "next-auth"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { z } from "zod"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function authenticate(values: any) {
    const t = await getTranslations('Login');
    try {
        await signIn("credentials", {
            email: values.email,
            password: values.password,
            redirect: false,
        })
        return { success: true }
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: t('invalidCredentials') }
                default:
                    return { error: t('error') }
            }
        }
        throw error
    }
}


const RegisterSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Correo inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
})

export async function register(values: z.infer<typeof RegisterSchema>) {
    const t = await getTranslations('Register');
    const validatedFields = RegisterSchema.safeParse(values);

    if (!validatedFields.success) {
        return { error: "Campos inválidos" };
    }

    const { email, password, name } = validatedFields.data;

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
            role: 'TECHNICIAN', // Default role for internal signups
        },
    });

    return { success: "Usuario creado exitosamente!" };
}

export async function logout() {
    await signOut({ redirectTo: "/login" });
}
