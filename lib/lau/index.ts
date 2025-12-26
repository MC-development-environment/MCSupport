/**
 * Asistente Virtual LAU - Punto de Entrada Principal
 * Exports centralizados para todo el sistema del asistente
 */

// Servicio Principal
export { AssistantService } from "./assistant-service";

// Tipos
export type {
  Language,
  TicketCategory,
  TicketPriority,
  Sentiment,
  ContentAnalysis,
  KBArticleMatch,
  AssignmentResult,
  KBResponseResult,
  AssistantConfig,
  TicketCreationPayload,
  TicketProcessingResult,
} from "./types";

// Constantes
export {
  ASSISTANT_EMAIL,
  DEFAULT_CONFIG,
  CATEGORY_KEYWORDS,
  PRIORITY_KEYWORDS,
  CATEGORY_DEPARTMENT_MAP,
} from "./constants";

// Analizador
export {
  detectLanguage,
  classifyCategory,
  detectPriority,
  detectSentiment,
  analyzeContent,
} from "./analyzer";

// Mensajes
export {
  getTimeBasedGreeting,
  formatMessage,
  randomMessage,
  getCategoryLabel,
  WELCOME_TEMPLATES,
  STATUS_MESSAGES,
  ASSIGNMENT_MESSAGES,
  KB_MESSAGES,
  CLOSING_MESSAGES,
  FOLLOWUP_MESSAGES,
  CATEGORY_LABELS,
} from "./messages";

// Auto Asignación
export {
  getDepartmentForCategory,
  findAvailableAgent,
  autoAssignTicket,
  generateAssignmentMessage,
} from "./auto-assignment";

// Respondedor KB
export {
  findRelevantArticles,
  generateKBResponse,
  generateSuggestionsText,
} from "./kb-responder";

// Auto Seguimiento
export { processAutoFollowup } from "./auto-followup";
