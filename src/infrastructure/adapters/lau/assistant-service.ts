/**
 * Asistente Virtual LAU - Servicio Principal
 * Servicio principal que orquesta todas las funcionalidades del asistente
 */

import { prisma } from "@/infrastructure/db/prisma";
import { logger } from "@/infrastructure/logging/logger";
import { sendEmail, BASE_URL } from "@/infrastructure/services/email/email-service";
import { escalationAlertEmail } from "@/infrastructure/services/email/email-templates";
import { assistantMetrics } from "@/core/services/metrics-service";
import { getTicketRecipients } from "@/core/services/ticket-helpers";

import type {
  Language,
  AssistantConfig,
  TicketProcessingResult,
  ContentAnalysis,
} from "./types";
import { ASSISTANT_EMAIL, DEFAULT_CONFIG } from "./constants";
import {
  getTimeBasedGreeting,
  WELCOME_TEMPLATES,
  STATUS_MESSAGES,
  CLOSING_MESSAGES,
  formatMessage,
  randomMessage,
} from "./messages";
import { detectLanguage, analyzeContent } from "./analyzer";
import { autoAssignTicket, generateAssignmentMessage } from "./auto-assignment";
import {
  findRelevantArticles,
  generateKBResponse,
  generateSuggestionsText,
} from "./kb-responder";

/**
 * Limpia el nombre del usuario eliminando sufijos de rol como "(Cliente)", "(Client)", etc.
 * Esto hace que el mensaje de LAU sea más natural y profesional.
 */
function cleanCreatorName(name: string): string {
  // Eliminar sufijos de rol comunes en paréntesis
  const cleaned = name
    .replace(/\s*\((Cliente|Client|Usuario|User|Admin|Manager)\)\s*$/i, "")
    .trim();
  return cleaned || name; // Retornar original si la limpieza resulta en cadena vacía
}

// Mapeo de categorías internas de LAU a categorías válidas de Prisma
// LAU usa categorías más granulares, Prisma tiene un enum más limitado
type PrismaCategoryType =
  | "NETSUITE_ERROR"
  | "ACCESS_ISSUE"
  | "FEATURE_REQUEST"
  | "HOW_TO"
  | "BILLING"
  | "INTEGRATION"
  | "PERFORMANCE"
  | "DEVELOPMENT"
  | "INTERNAL"
  | "OTHER";

const LAU_TO_PRISMA_CATEGORY: Record<string, PrismaCategoryType> = {
  SERVICE_COMPLAINT: "OTHER", // Quejas → OTHER (o podrías crear una categoría específica)
  SUPPORT: "OTHER", // Soporte general → OTHER
  CONSULTING: "BILLING", // Consultoría/facturación → BILLING
  DEVELOPMENT: "DEVELOPMENT", // Desarrollo → DEVELOPMENT (ya existe)
  INFRASTRUCTURE: "PERFORMANCE", // Infraestructura → PERFORMANCE
  NETWORK: "PERFORMANCE", // Redes → PERFORMANCE
  ACCOUNTING: "BILLING", // Contabilidad → BILLING
  OTHER: "OTHER", // Other → OTHER
  // Categorías que ya existen en Prisma (por si se usan directamente)
  NETSUITE_ERROR: "NETSUITE_ERROR",
  ACCESS_ISSUE: "ACCESS_ISSUE",
  FEATURE_REQUEST: "FEATURE_REQUEST",
  HOW_TO: "HOW_TO",
  BILLING: "BILLING",
  INTEGRATION: "INTEGRATION",
  PERFORMANCE: "PERFORMANCE",
  INTERNAL: "INTERNAL",
};

function mapCategoryToPrisma(lauCategory: string): PrismaCategoryType {
  return LAU_TO_PRISMA_CATEGORY[lauCategory] || "OTHER";
}

export class AssistantService {
  /**
   * Obtiene el usuario del asistente desde la BD
   */
  static async getAssistantUser() {
    return await prisma.user.findUnique({
      where: { email: ASSISTANT_EMAIL },
    });
  }

  /**
   * Verifica si el asistente está habilitado
   */
  static async isEnabled(): Promise<boolean> {
    const config = await prisma.systemConfig.findFirst();
    return config?.assistantEnabled ?? true;
  }

  /**
   * Obtiene la configuración del asistente
   */
  static async getConfig(): Promise<AssistantConfig> {
    const config = await prisma.systemConfig.findFirst();
    return {
      enabled: config?.assistantEnabled ?? DEFAULT_CONFIG.enabled,
      name: config?.assistantName || DEFAULT_CONFIG.name,
      autoAssignEnabled: DEFAULT_CONFIG.autoAssignEnabled,
      autoKBResponseEnabled: DEFAULT_CONFIG.autoKBResponseEnabled,
      kbRelevanceThreshold: DEFAULT_CONFIG.kbRelevanceThreshold,
      businessHoursStart:
        config?.businessHoursStart ?? DEFAULT_CONFIG.businessHoursStart,
      businessHoursEnd:
        config?.businessHoursEnd ?? DEFAULT_CONFIG.businessHoursEnd,
      followupReminderHours: DEFAULT_CONFIG.followupReminderHours,
      autoCloseAfterDays: DEFAULT_CONFIG.autoCloseAfterDays,
    };
  }

  /**
   * Detecta el idioma del texto (expuesto para uso externo)
   */
  static detectLanguage(text: string): Language {
    return detectLanguage(text);
  }

  /**
   * Verifica si estamos en horario laboral
   */
  static isBusinessHours(config: AssistantConfig): boolean {
    const currentHour = new Date().getHours();
    return (
      currentHour >= config.businessHoursStart &&
      currentHour < config.businessHoursEnd
    );
  }

  /**
   * Genera el mensaje de bienvenida completo
   */
  static generateWelcomeMessage(params: {
    creatorName: string;
    assistantName: string;
    ticketNumber: string;
    language: Language;
    isBusinessHours: boolean;
    analysis: ContentAnalysis;
    priorityChanged: boolean;
    assignmentMessage?: string;
    kbSuggestions?: string;
    kbAutoResponse?: string;
  }): string {
    const {
      creatorName,
      assistantName,
      ticketNumber,
      language,
      isBusinessHours,
      analysis,
      // priorityChanged, // Deprecated: No longer shown to user
      assignmentMessage,
      kbSuggestions,
      kbAutoResponse,
    } = params;

    const greeting = getTimeBasedGreeting(language);
    const templates = WELCOME_TEMPLATES[language];

    // Limpiar el nombre del creador (eliminar sufijos como "(Cliente)")
    const cleanedName = cleanCreatorName(creatorName);

    // Mensaje de apertura
    const openingMessage = formatMessage(randomMessage(templates), {
      greeting,
      name: cleanedName,
      assistant: assistantName,
      ticketNumber,
    });

    // Mensaje de estado según contexto
    let statusMessage = "";
    if (analysis.sentiment === "NEGATIVE") {
      statusMessage = STATUS_MESSAGES.escalated[language];
    } else if (analysis.priority === "CRITICAL") {
      statusMessage = STATUS_MESSAGES.critical[language];
    } else if (!isBusinessHours) {
      statusMessage = STATUS_MESSAGES.offHours[language];
    } else {
      statusMessage = randomMessage(STATUS_MESSAGES.normal[language]);
    }

    // Respuesta automática KB (si aplica)
    let kbResponse = "";
    if (kbAutoResponse) {
      kbResponse = kbAutoResponse;
    }

    // Mensaje de asignación
    const assignment = assignmentMessage || "";

    // Sugerencias KB
    const suggestions = kbSuggestions || "";

    // Cierre
    const closing = randomMessage(CLOSING_MESSAGES[language]);

    // Nota: priorityChanged ya no se muestra al usuario (transparente)
    return `${openingMessage}${statusMessage}${assignment}${kbResponse}${suggestions}${closing}`;
  }

  /**
   * Procesa la creación de un nuevo ticket
   * Esta es la función principal que orquesta todo el flujo
   */
  static async processTicketCreation(
    ticketId: string,
    ticketNumber: string,
    creatorName: string,
    title: string,
    description: string
  ): Promise<TicketProcessingResult> {
    const startTime = Date.now();

    try {
      // Verificar si está habilitado
      if (!(await this.isEnabled())) {
        logger.info(`[LAU] Disabled, skipping ticket ${ticketNumber}`);
        return {
          success: false,
          analysis: {
            priority: null,
            sentiment: "NEUTRAL",
            category: "OTHER",
            confidence: 0,
          },
          language: "es",
          welcomeMessageSent: false,
          escalated: false,
          error: "Assistant disabled",
        };
      }

      const assistant = await this.getAssistantUser();
      if (!assistant) {
        logger.error("[LAU] Assistant user not found");
        return {
          success: false,
          analysis: {
            priority: null,
            sentiment: "NEUTRAL",
            category: "OTHER",
            confidence: 0,
          },
          language: "es",
          welcomeMessageSent: false,
          escalated: false,
          error: "Assistant user not found",
        };
      }

      const config = await this.getConfig();
      const isBusinessHours = this.isBusinessHours(config);

      // ⏰ Delay natural antes de responder
      const baseDelay = DEFAULT_CONFIG.responseDelayMs;
      const variation =
        Math.floor(Math.random() * DEFAULT_CONFIG.responseDelayVariation * 2) -
        DEFAULT_CONFIG.responseDelayVariation;
      const finalDelay = Math.max(800, baseDelay + variation);
      await new Promise((resolve) => setTimeout(resolve, finalDelay));

      // 🌍 Detectar idioma
      const language = detectLanguage(`${title} ${description}`);
      logger.info(
        `[LAU] Detected language: ${language} for ticket ${ticketNumber}`
      );

      // 📊 Análisis de contenido
      const analysis = analyzeContent(title, description);
      let priorityChanged = false;

      assistantMetrics.trackSentimentDetection(analysis.sentiment);

      // Actualizar prioridad, sentimiento y categoría en BD
      if (
        analysis.priority ||
        analysis.sentiment !== "NEUTRAL" ||
        analysis.category
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};
        if (analysis.priority) {
          updateData.priority = analysis.priority;
          priorityChanged = true;
        }
        if (analysis.sentiment) {
          updateData.sentiment = analysis.sentiment;
        }
        // Guardar categoría detectada (mapeando a categoría válida de Prisma)
        if (analysis.category) {
          updateData.category = mapCategoryToPrisma(analysis.category);
        }

        await prisma.case.update({
          where: { id: ticketId },
          data: updateData,
        });
        logger.info(
          `[LAU] Updated ticket ${ticketNumber}: priority=${analysis.priority}, sentiment=${analysis.sentiment}, category=${analysis.category}`
        );
      }

      // 📧 Escalado automático
      let escalated = false;
      if (
        analysis.priority === "CRITICAL" ||
        analysis.sentiment === "NEGATIVE"
      ) {
        const alertReason =
          analysis.priority === "CRITICAL"
            ? "Critical System Failure Detected"
            : "Customer Distress/Negative Sentiment";
        const ticketUrl = `${BASE_URL}/admin/tickets/${ticketId}`;

        assistantMetrics.trackAutoEscalation(alertReason);

        await sendEmail({
          to: config.name
            ? "support@multicomputos.com"
            : "support@multicomputos.com",
          subject:
            language === "es"
              ? `[URGENTE] Escalado Automático - Ticket #${ticketNumber}`
              : `[URGENT] Auto-Escalation - Ticket #${ticketNumber}`,
          body: escalationAlertEmail(
            ticketNumber,
            alertReason,
            analysis.sentiment,
            ticketUrl,
            language
          ),
        });
        escalated = true;
        logger.info(`[LAU] Escalated ticket ${ticketNumber}`);
      }

      // 🎯 Auto-asignación (con skill matching)
      let assignmentMessage = "";
      let assignmentResult;

      if (config.autoAssignEnabled) {
        assignmentResult = await autoAssignTicket(
          ticketId,
          analysis.category,
          language,
          title, // Para skill matching
          description // Para skill matching
        );
        assignmentMessage = generateAssignmentMessage(
          assignmentResult,
          analysis.category,
          language
        );

        // Notify Assignee
        if (assignmentResult.success && assignmentResult.assignedToId) {
          const assignee = await prisma.user.findUnique({
            where: { id: assignmentResult.assignedToId },
            select: { email: true },
          });

          if (assignee?.email) {
            const { assignedEmail } = await import("@/infrastructure/services/email/email-templates");
            await sendEmail({
              to: assignee.email,
              subject: `Ticket Asignado (Auto) #${ticketNumber}`,
              body: assignedEmail(
                ticketNumber,
                title,
                `${BASE_URL}/admin/tickets/${ticketId}`
              ),
            });
            logger.info(
              `[LAU] Sent assignment notification to ${assignee.email}`
            );
          }
        }
      }

      // 📚 Respuesta KB automática
      let kbSuggestions = "";
      let kbAutoResponse = "";
      let kbResult;

      if (config.autoKBResponseEnabled) {
        kbResult = await generateKBResponse(
          ticketId,
          title,
          description,
          language,
          config.kbRelevanceThreshold
        );

        if (kbResult.autoResponded && kbResult.responseMessage) {
          kbAutoResponse = kbResult.responseMessage;
          // Cambiar estado a WAITING_CUSTOMER si hay respuesta automática
          await prisma.case.update({
            where: { id: ticketId },
            data: { status: "WAITING_CUSTOMER" },
          });
        }
      }

      // Si no hubo respuesta automática, buscar sugerencias
      if (!kbAutoResponse) {
        const articles = await findRelevantArticles(title, description, 3);
        kbSuggestions = generateSuggestionsText(articles, language);
      }

      // ✍️ Generar mensaje de bienvenida
      const welcomeMessage = this.generateWelcomeMessage({
        creatorName,
        assistantName: config.name,
        ticketNumber,
        language,
        isBusinessHours,
        analysis,
        priorityChanged,
        assignmentMessage,
        kbSuggestions,
        kbAutoResponse,
      });

      // 💬 Crear mensaje
      await prisma.message.create({
        data: {
          content: welcomeMessage,
          ticketId: ticketId,
          senderId: assistant.id,
          isInternal: false,
        },
      });

      // 📧 Notificar al cliente por email (incluyendo CC)
      const recipients = await getTicketRecipients(ticketId);

      if (recipients.to) {
        const { assistantResponseEmail } = await import(
          "@/infrastructure/services/email/email-templates"
        );
        const subjectText =
          language === "en"
            ? `${config.name} responded to your ticket`
            : `${config.name} ha respondido tu ticket`;

        await sendEmail({
          to: recipients.to,
          cc: recipients.cc,
          subject: `${subjectText} #${ticketNumber}`,
          body: assistantResponseEmail(
            ticketNumber,
            config.name,
            welcomeMessage,
            `${BASE_URL}/portal/tickets/${ticketId}`,
            language
          ),
        });
      }

      const processingTime = Date.now() - startTime;
      assistantMetrics.trackResponseTime(processingTime, ticketId);
      logger.info(
        `[LAU] Processed ticket ${ticketNumber} in ${processingTime}ms (Language: ${language})`
      );

      return {
        success: true,
        analysis,
        language,
        assignment: assignmentResult,
        kbResponse: kbResult,
        welcomeMessageSent: true,
        escalated,
      };
    } catch (error) {
      logger.error(`[LAU] Failed to process ticket ${ticketNumber}`, { error });
      return {
        success: false,
        analysis: {
          priority: null,
          sentiment: "NEUTRAL",
          category: "OTHER",
          confidence: 0,
        },
        language: "es",
        welcomeMessageSent: false,
        escalated: false,
        error: String(error),
      };
    }
  }
}
