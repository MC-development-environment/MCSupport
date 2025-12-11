"use server"

import { prisma } from "@/lib/prisma"
import { randomInt } from "crypto"
import { addMinutes } from "date-fns"
import { getTranslations } from "next-intl/server"

// Mock Email Sender
async function sendEmail(email: string, code: string) {
    console.log(`[MOCK EMAIL] To: ${email}, Code: ${code}`)
    // In production, integrate Resend or Nodemailer here
    return true;
}

export async function requestOtp(email: string) {
    const t = await getTranslations('Login.Otp');

    // 1. Check if email is allowed (Whitelist)
    // For now, allow @multicomputos.com or if exists in AllowedClientEmail table.
    // If table is empty, maybe allow all for dev?
    // User Requirement: "solo correos habilitados... lista blanca".
    // I will check the table.

    // Allow internal domain for testing too? "el cliente solo debe poner su correo".
    // Let's implement strict check.

    /* 
    const allowed = await prisma.allowedClientEmail.findUnique({
        where: { email }
    })
    
    // Also allow existing users with role CLIENT?
    const existingUser = await prisma.user.findUnique({ where: { email } })
    
    if (!allowed && existingUser?.role !== 'CLIENT') {
        return { error: "Correo no autorizado." }
    }
    */

    // Strict logic: Must be in allowed list OR be an existing user (maybe created by Netsuite integration).
    // Let's check user first.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
        // Check whitelist
        const allowed = await prisma.allowedClientEmail.findUnique({ where: { email } });
        if (!allowed || !allowed.isActive) {
            return { error: t('emailNotAuthorized') };
        }
    }

    // 2. Generate Code
    const code = randomInt(100000, 999999).toString();
    const expiresAt = addMinutes(new Date(), 15); // 15 min validity

    // 3. Store in DB
    await prisma.loginOTP.create({
        data: {
            email,
            code,
            expiresAt
        }
    })

    // 4. Send Email
    await sendEmail(email, code);

    return { success: true, message: t('codeSent') };
}

export async function verifyOtpAction(email: string, code: string) {
    // This action acts as a pre-check or alternative to signIn if needed, 
    // but actual session creation happens in 'auth.ts' provider.
    // We can use this to validate and then call signIn on client.

    const validOtp = await prisma.loginOTP.findFirst({
        where: {
            email,
            code,
            used: false,
            expiresAt: { gt: new Date() }
        }
    })

    if (!validOtp) {
        return { success: false }
    }

    return { success: true }
}
