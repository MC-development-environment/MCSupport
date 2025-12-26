import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validación de esquema para payload entrante de Netsuite
const netsuiteTicketSchema = z.object({
  externalId: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional()
    .default("MEDIUM"),
  customerEmail: z.string().email(),
  customerName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Rate Limiting
    const { checkRateLimit, getClientIdentifier } = await import(
      "@/lib/rate-limiter"
    );
    const identifier = getClientIdentifier(request.headers);
    const rateCheck = checkRateLimit(identifier, "api"); // 100 requests/min

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too Many Requests", retryAfter: rateCheck.resetMs },
        { status: 429 }
      );
    }

    // Validar API Key (Seguridad)
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== process.env.NETSUITE_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validar Payload
    const validData = netsuiteTicketSchema.safeParse(body);

    if (!validData.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: validData.error },
        { status: 400 }
      );
    }

    const {
      externalId,
      title,
      description,
      priority,
      customerEmail,
      customerName,
    } = validData.data;

    // Encontrar o Crear Usuario (Cliente)
    // En un escenario real, podríamos sincronizar clientes por separado, pero aquí usaremos lógica de auto-aprovisionamiento
    let user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: customerEmail,
          name: customerName || customerEmail.split("@")[0],
          role: "CLIENT",
          // Contraseña aleatoria o requerir restablecimiento
        },
      });
    }

    // Crear Caso
    const newCase = await prisma.case.create({
      data: {
        title,
        description,
        priority,
        status: "OPEN",
        userId: user.id,
        ticketNumber: `NS-${externalId}`, // Mapeando ID de Netsuite a Número de Ticket visible
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ticket created from Netsuite",
      ticketNumber: newCase.ticketNumber,
      caseId: newCase.id,
    });
  } catch (error) {
    console.error("Netsuite API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
