import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema validation for incoming Netsuite payload
const netsuiteTicketSchema = z.object({
    externalId: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().default("MEDIUM"),
    customerEmail: z.string().email(),
    customerName: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate API Key (Simulated security)
        const apiKey = request.headers.get("x-api-key");
        if (apiKey !== process.env.NETSUITE_API_KEY && apiKey !== "ns-secret-123") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate Payload
        const validData = netsuiteTicketSchema.safeParse(body);

        if (!validData.success) {
            return NextResponse.json({ error: "Invalid payload", details: validData.error }, { status: 400 });
        }

        const { externalId, title, description, priority, customerEmail, customerName } = validData.data;

        // Find or Create User (Customer)
        // In a real scenario, we might sync customers separately, but here we'll auto-provision logic
        let user = await prisma.user.findUnique({
            where: { email: customerEmail }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: customerEmail,
                    name: customerName || customerEmail.split('@')[0],
                    role: 'CLIENT',
                    // Random password or require reset
                }
            });
        }

        // Create Case
        const newCase = await prisma.case.create({
            data: {
                title,
                description,
                priority,
                status: 'OPEN',
                userId: user.id,
                ticketNumber: `NS-${externalId}`, // Mapping Netsuite ID to visible Ticket Number
            }
        });

        return NextResponse.json({
            success: true,
            message: "Ticket created from Netsuite",
            ticketNumber: newCase.ticketNumber,
            caseId: newCase.id
        });

    } catch (error) {
        console.error("Netsuite API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
