import nodemailer from 'nodemailer';
import { logger } from "@/lib/logger";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({
    to,
    cc = [],
    subject,
    body
}: {
    to: string;
    cc?: string[];
    subject: string;
    body: string;
}) {
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn("SMTP credentials not found. Falling back to mock email service.");
        console.log("---------------------------------------------------------");
        console.log(`[EMAIL MOCK] To: ${to}`);
        if (cc && cc.length > 0) {
            console.log(`[EMAIL MOCK] CC: ${cc.join(', ')}`);
        }
        console.log(`[EMAIL MOCK] Subject: ${subject}`);
        console.log(`[EMAIL MOCK] Body: ${body}`);
        console.log("---------------------------------------------------------");
        return { success: true };
    }

    try {
        const mailOptions: any = {
            from: process.env.SMTP_FROM || '"MC Support" <no-reply@mcsupport.com>',
            to,
            subject,
            text: body, // Fallback for plain text
            html: body.replace(/\n/g, '<br>'), // Simple HTML conversion
        };

        // Add CC if provided
        if (cc && cc.length > 0) {
            mailOptions.cc = cc.join(', ');
        }

        const info = await transporter.sendMail(mailOptions);

        logger.info(`Email sent: ${info.messageId}`, { to, cc, subject });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error("Failed to send email", { error });
        return { success: false, error: "Failed to send email" };
    }
}
