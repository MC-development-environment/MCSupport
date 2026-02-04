/**
 * Asistente Virtual LAU - Constantes
 * Configuración y constantes del asistente virtual
 */

// Email del asistente virtual
export const ASSISTANT_EMAIL = "assistant@multicomputos.com";

// Valores por defecto de configuración
export const DEFAULT_CONFIG = {
  enabled: true,
  name: "LAU",
  autoAssignEnabled: true,
  autoKBResponseEnabled: true,
  kbRelevanceThreshold: 80,
  businessHoursStart: 9,
  businessHoursEnd: 18,
  followupReminderHours: 48,
  autoCloseAfterDays: 7,
  responseDelayMs: 1000,
  responseDelayVariation: 400,
};

// Keywords para detección de categorías
// 8 categorías simplificadas: 1 por departamento + OTHER (fallback a Support)
export const CATEGORY_KEYWORDS = {
  // 🚨 PRIORIDAD ALTA - Quejas y cancelaciones → Service
  SERVICE_COMPLAINT: [
    "cancelar",
    "cancel",
    "cancellation",
    "cancelación",
    "terminar contrato",
    "end contract",
    "terminate",
    "queja",
    "reclamo",
    "complaint",
    "reclamación",
    "insatisfecho",
    "unsatisfied",
    "dissatisfied",
    "descontento",
    "unhappy",
    "decepcionado",
    "disappointed",
    "engañaron",
    "deceived",
    "scammed",
    "mal servicio",
    "bad service",
    "poor service",
    "terrible service",
    "reembolso",
    "refund",
    "devolver dinero",
    "money back",
    "inaceptable",
    "unacceptable",
  ],

  // 💼 Soporte Técnico General → Support
  SUPPORT: [
    // NetSuite/Errores
    "netsuite",
    "error",
    "script",
    "workflow",
    "saved search",
    "suitelet",
    "restlet",
    "suitescript",
    "scheduled script",
    // Acceso/Login
    "login",
    "password",
    "contraseña",
    "acceso",
    "access",
    "permission",
    "permiso",
    "locked",
    "bloqueado",
    "2fa",
    "authentication",
    // Rendimiento
    "slow",
    "lento",
    "performance",
    "rendimiento",
    "timeout",
    "crash",
    "loading",
    "cargando",
    "freeze",
    "congelado",
    // Ayuda general
    "how",
    "cómo",
    "como",
    "question",
    "pregunta",
    "help",
    "ayuda",
    "tutorial",
    "guide",
    "guía",
    "explain",
    "explicar",
  ],

  // 📊 Consultoría y Facturación → Consulting
  CONSULTING: [
    "consultoría",
    "consulting",
    "asesoría",
    "advisory",
    "capacitación",
    "training",
    "curso",
    "workshop",
    "taller",
    "implementación",
    "implementation",
    "migración",
    "migration",
    "factura electrónica",
    "electronic invoice",
    "cfdi",
    "facturación",
    "billing",
    "invoice",
    "factura",
    "impuestos",
    "taxes",
    "iva",
    "retenciones",
    "nota de crédito",
    "credit note",
    "nota de débito",
    "debit note",
    "pago",
    "payment",
    "suscripción",
    "subscription",
    "precio",
    "price",
  ],

  // 💻 Desarrollo e Integraciones → Development
  DEVELOPMENT: [
    "development",
    "desarrollo",
    "code",
    "código",
    "programming",
    "bug",
    "fix",
    "deploy",
    "deployment",
    "release",
    "branch",
    "merge",
    "commit",
    "github",
    "git",
    "customization",
    "personalización",
    "integration",
    "integración",
    "api",
    "webhook",
    "sync",
    "sincronizar",
    "connect",
    "conectar",
    "salesforce",
    "shopify",
    "third-party",
    "feature",
    "mejora",
    "improvement",
    "solicitud",
    "new feature",
  ],

  // 🖥️ Infraestructura → Infrastructure
  INFRASTRUCTURE: [
    "infraestructura",
    "infrastructure",
    "servidor",
    "server",
    "hardware",
    "datacenter",
    "centro de datos",
    "cloud",
    "nube",
    "aws",
    "azure",
    "google cloud",
    "hosting",
    "backup",
    "respaldo",
    "restore",
    "storage",
    "almacenamiento",
    "disco",
    "disk",
    "memoria",
    "memory",
    "ram",
    "cpu",
  ],

  // 🌐 Redes → Networks
  NETWORK: [
    "red",
    "redes",
    "network",
    "networking",
    "conexión",
    "connection",
    "internet",
    "wifi",
    "vpn",
    "firewall",
    "router",
    "switch",
    "dns",
    "ip",
    "dhcp",
    "proxy",
    "latencia",
    "latency",
    "ping",
    "conectividad",
    "connectivity",
    "bandwidth",
    "ancho de banda",
  ],

  // 📈 Contabilidad → Accounting
  ACCOUNTING: [
    "contabilidad",
    "accounting",
    "contador",
    "accountant",
    "balance",
    "estados financieros",
    "financial statements",
    "libro mayor",
    "ledger",
    "diario",
    "journal",
    "conciliación",
    "reconciliation",
    "cierre contable",
    "closing",
    "activo",
    "asset",
    "pasivo",
    "liability",
    "capital",
    "equity",
    "depreciación",
    "depreciation",
    "amortización",
    "amortization",
  ],
};

// Keywords para detección de prioridad
export const PRIORITY_KEYWORDS = {
  CRITICAL: [
    "sistema caído",
    "system down",
    "down",
    "sin servicio",
    "not working",
    "no funciona",
    "emergency",
    "emergencia",
    "production",
    "producción",
    "crash",
    "broken",
    "roto",
    "all users",
    "todos los usuarios",
    "parada total",
    "complete stop",
    "sin operación",
    "no operation",
  ],
  HIGH: [
    "urgente",
    "urgent",
    "crítico",
    "critical",
    "asap",
    "immediately",
    "inmediatamente",
    "blocking",
    "bloqueando",
    "important",
    "importante",
    "priority",
    "prioridad",
    "hoy",
    "today",
    "ahora",
    "now",
  ],
  LOW: [
    "pregunta",
    "question",
    "duda",
    "doubt",
    "when possible",
    "cuando puedas",
    "minor",
    "menor",
    "cosmetic",
    "estético",
    "no urgente",
    "not urgent",
    "bajo prioridad",
    "low priority",
  ],
};

// Keywords para detección de sentimiento negativo
export const NEGATIVE_SENTIMENT_KEYWORDS = [
  // Emociones negativas fuertes (ES)
  "terrible",
  "pésimo",
  "inútil",
  "basura",
  "vergüenza",
  "horror",
  "horrible",
  "inaceptable",
  "ridículo",
  "peor",
  "asqueroso",
  "patético",
  "decepcionado",
  "decepcionante",
  "frustrado",
  "frustración",
  "enfadado",
  "enojado",
  "molesto",
  "furioso",
  "harto",
  "cansado de",
  "no agusto",
  "incómodo",
  "engañado",
  "estafado",
  "timado",
  // Emociones negativas fuertes (EN)
  "terrible",
  "awful",
  "useless",
  "garbage",
  "shame",
  "horror",
  "horrible",
  "unacceptable",
  "ridiculous",
  "worst",
  "disgusting",
  "pathetic",
  "disappointed",
  "disappointing",
  "frustrated",
  "frustration",
  "angry",
  "mad",
  "upset",
  "furious",
  "fed up",
  "tired of",
  "uncomfortable",
  "deceived",
  "scammed",
  "cheated",
];

// Keywords para detección de idioma
export const LANGUAGE_DETECTION = {
  english:
    /\b(the|is|are|was|were|have|has|will|can|could|would|should|my|your|this|that|with|from|they|been|more|when|who|which|their|if|do|does)\b/gi,
  spanish:
    /\b(el|la|los|las|un|una|es|son|fue|fueron|tiene|tengo|sera|puede|podria|como|cuando|donde|quien|que|con|para|por|su|sus|mi|mis)\b/gi,
};

// Mapeo de categoría a departamento
// NOTA: Nombres de departamentos en Inglés (coinciden con base de datos)
// 7 categorías principales + OTHER (fallback a Support)
export const CATEGORY_DEPARTMENT_MAP: Record<string, string> = {
  SERVICE_COMPLAINT: "Service", // Quejas/cancelaciones → Service
  SUPPORT: "Support", // Soporte técnico general
  CONSULTING: "Consulting", // Consultoría, facturación, capacitación
  DEVELOPMENT: "Development", // Desarrollo, integraciones, features
  INFRASTRUCTURE: "Infrastructure", // Servidores, cloud, backup
  NETWORK: "Networks", // Redes, VPN, conectividad
  ACCOUNTING: "Accounting", // Contabilidad, balance
  OTHER: "Support", // Fallback → Support
};

// Orden de prioridad para evaluación de categorías
// SERVICE_COMPLAINT siempre primero
export const CATEGORY_PRIORITY_ORDER: string[] = [
  "SERVICE_COMPLAINT", // Máxima prioridad - quejas primero
  "INFRASTRUCTURE", // Infraestructura
  "NETWORK", // Redes
  "ACCOUNTING", // Contabilidad
  "CONSULTING", // Consultoría
  "DEVELOPMENT", // Desarrollo
  "SUPPORT", // Soporte general (último antes de OTHER)
];
