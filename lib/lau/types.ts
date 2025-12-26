/**
 * Asistente Virtual LAU - Tipos
 * Tipos centralizados para todo el sistema del asistente virtual
 */

// Idiomas soportados
export type Language = "es" | "en";

// Resultado del análisis de contenido
export interface ContentAnalysis {
  priority: TicketPriority | null;
  sentiment: Sentiment;
  category: TicketCategory;
  confidence: number; // 0-100
}

// Categorías de tickets - 8 categorías simplificadas (1 por departamento + OTHER)
export type TicketCategory =
  | "SERVICE_COMPLAINT" // Quejas/cancelaciones → Service
  | "SUPPORT" // Soporte técnico general → Support
  | "CONSULTING" // Consultoría/facturación → Consulting
  | "DEVELOPMENT" // Desarrollo/integraciones → Development
  | "INFRASTRUCTURE" // Infraestructura → Infrastructure
  | "NETWORK" // Redes → Networks
  | "ACCOUNTING" // Contabilidad → Accounting
  | "OTHER"; // Fallback → Support

// Prioridades de tickets
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// Sentimientos
export type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

// Resultado de artículo KB con scoring
export interface KBArticleMatch {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  relevanceScore: number; // 0-100
}

// Resultado de asignación automática
export interface AssignmentResult {
  success: boolean;
  assignedToId?: string;
  assignedToName?: string;
  reason: string;
}

// Resultado de respuesta KB
export interface KBResponseResult {
  hasRelevantArticle: boolean;
  article?: KBArticleMatch;
  responseMessage?: string;
  autoResponded: boolean;
}

// Configuración del asistente
export interface AssistantConfig {
  enabled: boolean;
  name: string;
  autoAssignEnabled: boolean;
  autoKBResponseEnabled: boolean;
  kbRelevanceThreshold: number; // 0-100, default 80
  businessHoursStart: number;
  businessHoursEnd: number;
  followupReminderHours: number; // default 48
  autoCloseAfterDays: number; // default 7
}

// Payload para procesar ticket nuevo
export interface TicketCreationPayload {
  ticketId: string;
  ticketNumber: string;
  creatorName: string;
  title: string;
  description: string;
  creatorEmail?: string;
}

// Resultado del procesamiento de ticket
export interface TicketProcessingResult {
  success: boolean;
  analysis: ContentAnalysis;
  language: Language;
  assignment?: AssignmentResult;
  kbResponse?: KBResponseResult;
  welcomeMessageSent: boolean;
  escalated: boolean;
  error?: string;
}
