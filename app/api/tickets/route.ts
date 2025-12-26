import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { z } from "zod";
import { logActivity, AuditAction, AuditEntity } from "@/lib/audit-service";
import { sendEmail, BASE_URL } from "@/lib/email-service";
import { ticketCreatedEmail } from "@/lib/email-templates";
import { AssistantService } from "@/lib/lau";
import { revalidatePath } from "next/cache";

const TicketSchema = z.object({
  title: z
    .string()
    .min(5, { message: "El título debe tener al menos 5 caracteres" }),
  description: z
    .string()
    .min(10, { message: "La descripción debe tener al menos 10 caracteres" }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Rate Limiting
    const { checkRateLimit, getClientIdentifier } = await import(
      "@/lib/rate-limiter"
    );
    const identifier =
      session.user.email || getClientIdentifier(request.headers);
    const rateCheck = checkRateLimit(identifier, "ticket");

    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: rateCheck.message,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();

    const rawData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as string,
    };

    const validation = TicketSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0]?.message || "Error de validación",
        },
        { status: 400 }
      );
    }

    const { title, description, priority } = validation.data;
    const ticketNumber = "CN-" + Math.floor(Date.now() / 1000);
    const userId = session.user.id;

    // Verificación de seguridad para sesiones obsoletas
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Usuario no válido. Por favor cierre sesión e ingrese nuevamente.",
        },
        { status: 401 }
      );
    }

    // Validar archivos
    const files = formData.getAll("images") as File[];
    const validFiles = files
      .filter((f) => f.size > 0 && f.name !== "undefined")
      .slice(0, 10);

    const totalSize = validFiles.reduce((acc, file) => acc + file.size, 0);
    const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30MB

    if (totalSize > MAX_TOTAL_SIZE) {
      console.error(
        `Total file size ${totalSize} bytes exceeds limit ${MAX_TOTAL_SIZE} bytes`
      );
      return NextResponse.json(
        {
          success: false,
          error: "El tamaño total de los archivos excede el límite de 30MB.",
        },
        { status: 400 }
      );
    }

    for (const file of validFiles) {
      if (!file.type.startsWith("image/")) {
        console.error(`Invalid file type: ${file.type} for file ${file.name}`);
        return NextResponse.json(
          { success: false, error: "Solo se permiten archivos de imagen." },
          { status: 400 }
        );
      }
      if (file.size > 10 * 1024 * 1024) {
        console.error(`File ${file.name} exceeds 10MB individual limit`);
        return NextResponse.json(
          { success: false, error: "Cada archivo no puede exceder 10MB." },
          { status: 400 }
        );
      }
    }

    // Parsear y validar correos en CC
    let ccEmailsArray: string[] = [];
    const ccEmailsRaw = formData.get("ccEmails") as string | null;
    if (ccEmailsRaw && ccEmailsRaw.trim()) {
      // Dividir por coma o punto y coma y eliminar espacios
      ccEmailsArray = ccEmailsRaw
        .split(/[,;]/)
        .map((email) => email.trim())
        .filter((email) => {
          // Validación básica de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        });

      // Validar cantidad de correos en CC (max 20)
      const MAX_CC_RECIPIENTS = 20;
      if (ccEmailsArray.length > MAX_CC_RECIPIENTS) {
        return NextResponse.json(
          {
            success: false,
            error: `Máximo ${MAX_CC_RECIPIENTS} destinatarios en CC permitidos.`,
          },
          { status: 400 }
        );
      }
    }

    // Calcular Objetivo SLA
    const systemConfig = await prisma.systemConfig.findFirst();
    let slaTargetAt: Date | undefined;

    if (systemConfig) {
      const { calculateSlaTarget } = await import("@/lib/sla-service");

      // Determinar horas basado en prioridad
      let hours = systemConfig.slaMedium; // Default
      switch (priority) {
        case "LOW":
          hours = systemConfig.slaLow;
          break;
        case "MEDIUM":
          hours = systemConfig.slaMedium;
          break;
        case "HIGH":
          hours = systemConfig.slaHigh;
          break;
        case "CRITICAL":
          hours = systemConfig.slaCritical;
          break;
      }

      slaTargetAt = calculateSlaTarget(new Date(), hours, systemConfig);
    }

    // Crear ticket con correos en CC
    const ticket = await prisma.case.create({
      data: {
        title,
        description,
        priority,
        status: "OPEN",
        ticketNumber,
        userId,
        ccEmails: ccEmailsArray,
        slaTargetAt,
      },
      include: { user: true },
    });

    // NetSuite Sync (Fire and Forget)
    const { NetSuiteService } = await import("@/lib/netsuite/service");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    NetSuiteService.createCase({
      ...ticket,
      user: { email: session.user.email, phone: null },
    })
      .then((res) => {
        if (res?.internalId) {
          prisma.case
            .update({
              where: { id: ticket.id },
              data: { netsuiteId: res.internalId, netsuiteUrl: res.url },
            })
            .catch(console.error);
        }
      })
      .catch((err) => console.error("NetSuite Sync Error:", err));

    await logActivity(AuditAction.CREATE, AuditEntity.TICKET, ticket.id, {
      title: ticket.title,
      priority: ticket.priority,
    });

    // Subir archivos
    if (validFiles.length > 0) {
      for (const file of validFiles) {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);

          // Subir a Cloudinary
          const uploadResult = await uploadToCloudinary(
            buffer,
            "mc_support_tickets"
          );

          await prisma.attachment.create({
            data: {
              name: file.name,
              url: uploadResult.url,
              size: file.size,
              type: file.type,
              ticketId: ticket.id,
              userId,
            },
          });
        } catch (err) {
          console.error(`Error uploading file ${file.name}:`, err);
          // Continuar con otros archivos en lugar de fallar completamente
        }
      }
    }

    // Enviar correo
    if (session.user.email) {
      // Detectar idioma del contenido del ticket
      const lang = AssistantService.detectLanguage(description);
      const subjectText = lang === "en" ? "Ticket Received" : "Ticket Recibido";

      await sendEmail({
        to: session.user.email,
        cc: ccEmailsArray,
        subject: `${subjectText}: ${ticket.ticketNumber}`,
        body: ticketCreatedEmail(
          ticket.id,
          ticket.ticketNumber,
          ticket.title,
          `${BASE_URL}/portal/tickets/${ticket.id}`,
          lang
        ),
      });
    }

    // Disparar Asistente (fire and forget)
    AssistantService.processTicketCreation(
      ticket.id,
      ticket.ticketNumber,
      session.user.name || "Usuario",
      ticket.title,
      ticket.description
    ).catch((err) => {
      console.error("Assistant Error:", err);
    });

    revalidatePath("/portal/tickets");

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear el ticket. Por favor intente nuevamente.",
      },
      { status: 500 }
    );
  }
}
