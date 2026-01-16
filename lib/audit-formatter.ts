/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuditAction } from "./audit-service";

interface AuditDetails {
  [key: string]: any;
}

// Mapeos de traducción
const translations = {
  priority: {
    LOW: { es: "BAJA", en: "LOW" },
    MEDIUM: { es: "MEDIA", en: "MEDIUM" },
    HIGH: { es: "ALTA", en: "HIGH" },
    CRITICAL: { es: "CRÍTICA", en: "CRITICAL" },
  } as Record<string, { es: string; en: string }>,
  category: {
    NETSUITE_ERROR: { es: "Error de NetSuite", en: "NetSuite Error" },
    ACCESS_ISSUE: { es: "Problema de Acceso", en: "Access Issue" },
    FEATURE_REQUEST: { es: "Nueva Funcionalidad", en: "Feature Request" },
    HOW_TO: { es: "Consulta / How-To", en: "How-To" },
    BILLING: { es: "Facturación", en: "Billing" },
    INTEGRATION: { es: "Integración", en: "Integration" },
    PERFORMANCE: { es: "Rendimiento", en: "Performance" },
    DEVELOPMENT: { es: "Desarrollo", en: "Development" },
    INTERNAL: { es: "Interno", en: "Internal" },
    OTHER: { es: "Otro", en: "Other" },
    // Categorías específicas de LAU de respaldo
    SERVICE_COMPLAINT: { es: "Queja de Servicio", en: "Service Complaint" },
    SUPPORT: { es: "Soporte", en: "Support" },
    CONSULTING: { es: "Consultoría", en: "Consulting" },
    INFRASTRUCTURE: { es: "Infraestructura", en: "Infrastructure" },
    NETWORK: { es: "Redes", en: "Network" },
    ACCOUNTING: { es: "Contabilidad", en: "Accounting" },
  } as Record<string, { es: string; en: string }>,
  status: {
    OPEN: { es: "ABIERTO", en: "OPEN" },
    IN_PROGRESS: { es: "EN PROGRESO", en: "IN PROGRESS" },
    WAITING_CUSTOMER: { es: "ESPERANDO CLIENTE", en: "WAITING CUSTOMER" },
    RESOLVED: { es: "RESUELTO", en: "RESOLVED" },
    CLOSED: { es: "CERRADO", en: "CLOSED" },
  } as Record<string, { es: string; en: string }>,
};

function t(
  group: "priority" | "category" | "status",
  key: string | null | undefined,
  locale: "es" | "en"
): string {
  if (!key) return "N/A";
  const map = translations[group];
  const entry =
    (map as Record<string, { es: string; en: string }>)[key] ||
    (map as Record<string, { es: string; en: string }>)[key.toUpperCase()];
  return entry ? entry[locale] : key;
}

export function formatAuditDetails(
  action: string,
  details: AuditDetails | null,
  locale: string = "es"
): string {
  if (!details) return "";

  const lang = locale === "es" ? "es" : "en";
  const isEs = locale === "es";

  switch (action) {
    case AuditAction.CREATE:
      if (details.title) {
        return isEs
          ? `Ticket creado: "${details.title}" (Prioridad: ${t(
              "priority",
              details.priority,
              lang
            )})`
          : `Ticket created: "${details.title}" (Priority: ${t(
              "priority",
              details.priority,
              lang
            )})`;
      }
      return isEs ? "Elemento creado" : "Item created";

    case AuditAction.STATUS_CHANGE:
      if (details.oldStatus && details.newStatus) {
        return isEs
          ? `Estado cambiado de ${t("status", details.oldStatus, lang)} a ${t(
              "status",
              details.newStatus,
              lang
            )}`
          : `Status changed from ${t("status", details.oldStatus, lang)} to ${t(
              "status",
              details.newStatus,
              lang
            )}`;
      }
      return isEs ? "Estado actualizado" : "Status updated";

    case AuditAction.ASSIGN:
      if (details.method === "auto-assignment") {
        return isEs
          ? `Asignado automáticamente a ${details.assignedTo} (Categoría: ${t(
              "category",
              details.category,
              lang
            )})`
          : `Auto-assigned to ${details.assignedTo} (Category: ${t(
              "category",
              details.category,
              lang
            )})`;
      }
      if (details.assignedTo) {
        return isEs
          ? `Asignado a ${details.assignedTo}`
          : `Assigned to ${details.assignedTo}`;
      }
      return isEs ? "Ticket asignado" : "Ticket assigned";

    case AuditAction.UPDATE:
      if (details.field === "category") {
        return isEs
          ? `Categoría cambiada de ${t("category", details.from, lang)} a ${t(
              "category",
              details.to,
              lang
            )}`
          : `Category changed from ${t("category", details.from, lang)} to ${t(
              "category",
              details.to,
              lang
            )}`;
      }
      // Actualización de campo general
      if (details.field) {
        return isEs
          ? `Campo ${details.field} actualizado de ${details.from} a ${details.to}`
          : `Field ${details.field} updated from ${details.from} to ${details.to}`;
      }
      // Acción de reabrir
      if (details.action === "reopen") {
        // En reabrir, el previous status siempre es CLOSED/RESOLVED y el nuevo OPEN, pero detalles solo tiene assignedTo
        return isEs
          ? `Caso reabierto y asignado a ${details.assignedTo}`
          : `Case reopened and assigned to ${details.assignedTo}`;
      }
      return isEs ? "Actualización realizada" : "Update performed";

    case AuditAction.LOGIN:
      return isEs ? "Inicio de sesión exitoso" : "Successful login";

    default:
      return JSON.stringify(details);
  }
}
