/**
 * Asistente Virtual LAU - Mensajes Bilingües
 * Mensajes profesionales y ejecutivos en español e inglés
 */

import type { Language, TicketCategory } from "./types";

// Saludos según hora del día
export function getTimeBasedGreeting(language: Language): string {
  const hour = new Date().getHours();

  if (language === "es") {
    if (hour >= 5 && hour < 12) return "Buenos días";
    if (hour >= 12 && hour < 19) return "Buenas tardes";
    return "Buenas noches";
  } else {
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    return "Good evening";
  }
}

// Mensajes de bienvenida - Tono profesional y ejecutivo
export const WELCOME_TEMPLATES = {
  es: [
    "{greeting} {name}, soy {assistant}, asistente de soporte. He registrado tu solicitud con el número **{ticketNumber}**.",
    "{greeting} {name}. He recibido tu caso y le he asignado el ticket **{ticketNumber}**. Soy {assistant}, tu asistente de soporte.",
    "{greeting} {name}. Gracias por contactarnos. Tu solicitud ha sido registrada como ticket **{ticketNumber}**.",
  ],
  en: [
    "{greeting} {name}, I'm {assistant}, support assistant. Your request has been registered as ticket **{ticketNumber}**.",
    "{greeting} {name}. I've received your case and assigned it ticket number **{ticketNumber}**. I'm {assistant}, your support assistant.",
    "{greeting} {name}. Thank you for contacting us. Your request has been registered as ticket **{ticketNumber}**.",
  ],
};

// Mensajes de estado - Profesionales sin emojis
export const STATUS_MESSAGES = {
  priorityChanged: {
    es: "\n\n*Nota: La prioridad ha sido ajustada a **{priority}** según el análisis de tu solicitud.*",
    en: "\n\n*Note: Priority has been adjusted to **{priority}** based on the analysis of your request.*",
  },
  escalated: {
    es: "\n\nComprendo la urgencia de tu caso. He escalado tu solicitud con prioridad alta a nuestro equipo de supervisores para revisión inmediata.",
    en: "\n\nI understand the urgency of your case. I've escalated your request with high priority to our supervisors for immediate review.",
  },
  critical: {
    es: "\n\nTu caso ha sido marcado como crítico. El equipo técnico ha sido notificado y estamos priorizando tu solicitud.",
    en: "\n\nYour case has been marked as critical. The technical team has been notified and we're prioritizing your request.",
  },
  offHours: {
    es: "\n\nActualmente estamos fuera de horario laboral. Tu caso ha sido registrado y será atendido a primera hora del siguiente día hábil.",
    en: "\n\nWe're currently outside business hours. Your case has been logged and will be addressed first thing next business day.",
  },
  normal: {
    es: [
      "\n\nTu solicitud está siendo procesada por nuestro equipo. Te mantendremos informado del avance.",
      "\n\nUn miembro de nuestro equipo revisará tu caso y te contactará con actualizaciones.",
      "\n\nTu solicitud ha sido asignada a nuestro equipo técnico. Recibirás una respuesta pronto.",
    ],
    en: [
      "\n\nYour request is being processed by our team. We'll keep you informed of progress.",
      "\n\nA team member will review your case and contact you with updates.",
      "\n\nYour request has been assigned to our technical team. You'll receive a response shortly.",
    ],
  },
};

// Mensajes de asignación automática - Sin emojis
// NOTA: LAU solo muestra el departamento. El nombre del técnico aparece cuando el Team Lead reasigna.
export const ASSIGNMENT_MESSAGES = {
  // Mensaje cuando categoría y departamento son diferentes (ej: "Consultoría" → "Consultoría")
  categoryAndDepartment: {
    es: "\n\nHe clasificado tu solicitud como **{category}** y ha sido asignada al equipo de **{department}**.",
    en: "\n\nI've classified your request as **{category}** and assigned it to the **{department}** team.",
  },
  // Mensaje cuando categoría y departamento son similares (evita redundancia)
  assignedOnly: {
    es: "\n\nTu solicitud ha sido asignada al equipo de **{department}**.",
    en: "\n\nYour request has been assigned to the **{department}** team.",
  },
  assignedToDepartment: {
    es: "\n\nTu caso ha sido asignado al equipo de **{department}**.",
    en: "\n\nYour case has been assigned to the **{department}** team.",
  },
  // Para cuando el Team Lead reasigna a un técnico específico
  assignedToAgent: {
    es: "\n\nTu caso ha sido asignado a **{agentName}** del equipo de **{department}**.",
    en: "\n\nYour case has been assigned to **{agentName}** from the **{department}** team.",
  },
  noAgentAvailable: {
    es: "\n\nTu caso está en cola y será asignado al próximo agente disponible.",
    en: "\n\nYour case is in queue and will be assigned to the next available agent.",
  },
  // Ya no se usa por separado - se combina con categoryAndDepartment
  category: {
    es: "\n\nHe clasificado tu solicitud como: **{category}**",
    en: "\n\nI've classified your request as: **{category}**",
  },
};

// Mensajes de respuesta KB - Sin emojis
export const KB_MESSAGES = {
  suggestion: {
    es: "\n\n**Recursos relacionados que pueden ayudarte:**\n",
    en: "\n\n**Related resources that may help:**\n",
  },
  autoResponse: {
    es: "\n\n**Información relevante encontrada:**\n\n{excerpt}\n\n[Ver artículo completo]({url})\n\n¿Esto resuelve tu consulta? Si es así, puedes cerrar el ticket. Si necesitas más ayuda, responde aquí.",
    en: "\n\n**Relevant information found:**\n\n{excerpt}\n\n[View full article]({url})\n\nDoes this resolve your query? If so, you can close the ticket. If you need more help, reply here.",
  },
};

// Mensajes de cierre - Profesionales
export const CLOSING_MESSAGES = {
  es: [
    "\n\n¿Tienes información adicional? Puedes responder a este mensaje.",
    "\n\nSi deseas agregar más detalles, responde aquí.",
    "\n\nQuedamos atentos a cualquier información adicional.",
  ],
  en: [
    "\n\nDo you have additional information? You can reply to this message.",
    "\n\nIf you'd like to add more details, reply here.",
    "\n\nWe remain attentive to any additional information.",
  ],
};

// Mensajes de seguimiento automático - Sin emojis
export const FOLLOWUP_MESSAGES = {
  reminder: {
    es: "Estimado cliente, soy {assistant}. Han pasado {hours} horas desde nuestra última comunicación sobre tu ticket **{ticketNumber}**.\n\n¿Tu consulta fue resuelta? Si es así, puedes cerrar el ticket. Si aún requieres asistencia, por favor responde a este mensaje.",
    en: "Dear customer, this is {assistant}. It's been {hours} hours since our last communication about your ticket **{ticketNumber}**.\n\nWas your issue resolved? If so, you can close the ticket. If you still need assistance, please reply to this message.",
  },
  autoCloseWarning: {
    es: "Aviso: Tu ticket **{ticketNumber}** será cerrado automáticamente en 24 horas por inactividad. Si aún necesitas asistencia, por favor responde a este mensaje.",
    en: "Notice: Your ticket **{ticketNumber}** will be automatically closed in 24 hours due to inactivity. If you still need assistance, please reply to this message.",
  },
  autoClosed: {
    es: "Este ticket ha sido cerrado automáticamente por inactividad. Si necesitas reabrir el caso, crea un nuevo ticket haciendo referencia al número **{ticketNumber}**.",
    en: "This ticket has been automatically closed due to inactivity. If you need to reopen the case, create a new ticket referencing ticket number **{ticketNumber}**.",
  },
};

// Etiquetas de categorías traducidas - 8 categorías simplificadas
export const CATEGORY_LABELS: Record<
  TicketCategory,
  { es: string; en: string }
> = {
  SERVICE_COMPLAINT: { es: "Queja o Reclamo", en: "Complaint" },
  SUPPORT: { es: "Soporte Técnico", en: "Technical Support" },
  CONSULTING: { es: "Consultoría", en: "Consulting" },
  DEVELOPMENT: { es: "Desarrollo", en: "Development" },
  INFRASTRUCTURE: { es: "Infraestructura", en: "Infrastructure" },
  NETWORK: { es: "Redes", en: "Network" },
  ACCOUNTING: { es: "Contabilidad", en: "Accounting" },
  OTHER: { es: "Otro", en: "Other" },
};

// Etiquetas de departamentos traducidas (DB name → Display name)
// 7 departamentos activos (sin Applications)
export const DEPARTMENT_LABELS: Record<string, { es: string; en: string }> = {
  Support: { es: "Soporte", en: "Support" },
  Development: { es: "Desarrollo", en: "Development" },
  Consulting: { es: "Consultoría", en: "Consulting" },
  Service: { es: "Servicio al Cliente", en: "Customer Service" },
  Infrastructure: { es: "Infraestructura", en: "Infrastructure" },
  Networks: { es: "Redes", en: "Networks" },
  Accounting: { es: "Contabilidad", en: "Accounting" },
};

// Función helper para reemplazar placeholders
export function formatMessage(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{${key}}`, "g"), value);
  }
  return result;
}

// Función helper para seleccionar mensaje aleatorio
export function randomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

// Obtener etiqueta de categoría traducida
export function getCategoryLabel(
  category: TicketCategory,
  language: Language
): string {
  return CATEGORY_LABELS[category][language];
}

// Obtener etiqueta de departamento traducida
export function getDepartmentLabel(
  departmentName: string,
  language: Language
): string {
  const labels = DEPARTMENT_LABELS[departmentName];
  if (labels) {
    return labels[language];
  }
  // Fallback: retornar nombre original si no encuentra
  return departmentName;
}
