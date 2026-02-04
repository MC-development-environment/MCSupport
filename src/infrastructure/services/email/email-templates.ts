import { BASE_URL } from "@/infrastructure/services/email/email-service";

// Colores de marca Multicomputos
const MULTICOMPUTOS_BLUE = "#19607e"; // Azul de Marca
const MULTICOMPUTOS_ORANGE = "#ebae23"; // Naranja/Amarillo de Marca

export const emailStyles = {
  container: `
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        background-color: #ffffff;
    `,
  header: `
        background-color: ${MULTICOMPUTOS_BLUE};
        padding: 24px;
        text-align: center;
    `,
  headerText: `
        color: #ffffff;
        font-size: 24px;
        font-weight: 600;
        margin: 0;
    `,
  body: `
        padding: 32px 24px;
        color: #334155;
        line-height: 1.6;
    `,
  footer: `
        background-color: #1e293b;
        padding: 16px;
        text-align: center;
        font-size: 12px;
        color: #94a3b8;
        border-top: 1px solid #334155;
    `,
  // Botón estilizado como tabla para compatibilidad con clientes de correo
  button: `
        display: inline-block;
        background-color: ${MULTICOMPUTOS_ORANGE};
        color: #ffffff !important;
        padding: 14px 28px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        font-size: 16px;
        border: none;
        mso-padding-alt: 0;
    `,
  // Botón Azul para acciones de "Responder"
  buttonBlue: `
        display: inline-block;
        background-color: ${MULTICOMPUTOS_BLUE};
        color: #ffffff !important;
        padding: 14px 28px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        font-size: 16px;
        border: none;
        mso-padding-alt: 0;
    `,
  highlight: `
        color: ${MULTICOMPUTOS_BLUE};
        font-weight: 600;
    `,
};

// Tipo de idioma soportado
export type EmailLanguage = "es" | "en";

// Diccionario de traducciones para correos
const emailTranslations = {
  es: {
    welcome: {
      title: "Bienvenido a MC Support",
      greeting: "Hola",
      body: "Bienvenido al Sistema de Soporte de Multicomputos. Tu cuenta ha sido creada exitosamente.",
      body2:
        "Ahora puedes iniciar sesión en el portal para enviar tickets de soporte, ver artículos de la base de conocimiento y dar seguimiento a tus solicitudes.",
      button: "Acceder al Portal",
      questions:
        "Si tienes alguna pregunta, no dudes en responder a este correo.",
      regards: "Saludos cordiales",
      team: "El Equipo de Soporte MC",
      rights: "Todos los derechos reservados.",
    },
    welcomeWithPassword: {
      title: "🎉 ¡Bienvenido a MC Support!",
      greeting: "Hola",
      body: "Tu cuenta ha sido creada en el Sistema de Soporte de Multicomputos.",
      credentialsTitle: "Tus credenciales de acceso:",
      emailLabel: "Email:",
      passwordLabel: "Contraseña temporal:",
      warningTitle: "⚠️ IMPORTANTE",
      warningBody:
        'Por tu seguridad, debes cambiar tu contraseña la primera vez que inicies sesión. Haz clic en tu perfil y selecciona "Cambiar contraseña".',
      body2:
        "Con tu cuenta puedes enviar tickets de soporte, consultar artículos de la base de conocimiento y dar seguimiento a tus solicitudes.",
      button: "Iniciar Sesión",
      questions: "Si tienes alguna pregunta, no dudes en contactarnos.",
      regards: "Saludos cordiales",
      team: "El Equipo de Soporte MC",
    },
    ticketCreated: {
      title: "Ticket Recibido",
      greeting: "Hola",
      body: "Hemos recibido tu solicitud de soporte. Se ha creado un ticket con los siguientes datos:",
      ticketLabel: "Ticket #:",
      subjectLabel: "Asunto:",
      body2:
        "Nuestro equipo de soporte revisará tu solicitud y te responderá a la brevedad.",
      button: "Ver Ticket",
    },
    statusChange: {
      title: "Actualización de Ticket",
      greeting: "Hola",
      body: "El estado de tu ticket",
      updated: "ha sido actualizado.",
      subjectLabel: "Asunto:",
      statusLabel: "Nuevo Estado:",
      body2: "Inicia sesión en el portal para más detalles o para responder.",
      button: "Ver Actualización",
      closeQuestion: "¿Tu problema fue resuelto?",
      closeDesc:
        "Si tu solicitud ha sido atendida satisfactoriamente, puedes cerrar el ticket directamente:",
      closeButton: "✅ Cerrar Ticket",
    },
    assigned: {
      title: "Ticket Asignado",
      greeting: "Hola",
      body: "Se te ha asignado el siguiente ticket:",
      body2: "Por favor revísalo y toma las acciones necesarias.",
      button: "Abrir Ticket",
    },
    escalation: {
      title: "⚠️ Escalación Urgente",
      greeting: "Hola Supervisores",
      body: "El sistema ha escalado automáticamente el siguiente ticket para atención inmediata:",
      reasonLabel: "Razón:",
      sentimentLabel: "Análisis de Sentimiento:",
      body2: "Este ticket requiere revisión e intervención urgente.",
      button: "Ver Ticket Escalado",
    },
    assistantResponse: {
      title: "ha respondido",
      greeting: "Hola",
      body: "nuestra asistente virtual, ha revisado tu ticket",
      body2: "y te ha enviado un mensaje:",
      body3:
        "Si tienes alguna pregunta adicional, puedes responder directamente en el portal.",
      button: "Ver Ticket Completo",
      disclaimer:
        "Este es un mensaje automático generado por nuestro asistente virtual. Para responder, por favor usa el portal de soporte.",
    },
    newMessage: {
      title: "💬 Nuevo Mensaje en tu Ticket",
      greeting: "Hola",
      body: "Has recibido un nuevo mensaje en tu ticket",
      fromLabel: "De:",
      body2: "Para responder a este mensaje, accede al portal de soporte.",
      button: "Responder",
    },
    vacation: {
      activatedTitle: "🏝️ Modo Vacaciones Activado",
      greeting: "Hola",
      activatedBody: "Tu modo vacaciones ha sido activado correctamente.",
      fromLabel: "📅 Desde:",
      untilLabel: "📅 Hasta:",
      ticketsReassigned: "📋 Tickets reasignados:",
      reassignedTo: "👤 Reasignados a:",
      enjoyVacation:
        "¡Disfruta tus vacaciones! Tus tickets están en buenas manos.",
      rights: "Todos los derechos reservados.",
      reassignmentTitle: "📋 Tickets Reasignados por Vacaciones",
      reassignmentBody: "ha activado su modo vacaciones y te ha reasignado",
      tickets: "ticket(s)",
      vacationPeriod: "⏰ Periodo de vacaciones:",
      messageLabel: "💬 Mensaje:",
      ticketsToHandle: "Tickets a atender:",
      ticketColumn: "Ticket",
      subjectColumn: "Asunto",
      priorityColumn: "Prioridad",
      viewTickets: "Ver Tickets",
      clientNotificationTitle: "ℹ️ Actualización de tu Ticket",
      clientNotificationBody:
        "Te informamos que tu ticket ha sido reasignado a otro miembro de nuestro equipo.",
      ticketLabel: "Ticket:",
      subjectLabel: "Asunto:",
      newResponsible: "Nuevo responsable:",
      reason: "Motivo:",
      continuedPriority:
        "Tu caso sigue siendo nuestra prioridad y continuará siendo atendido sin interrupciones.",
      viewMyTicket: "Ver mi Ticket",
    },
  },
  en: {
    welcome: {
      title: "Welcome to MC Support",
      greeting: "Hello",
      body: "Welcome to the Multicomputos Support System. Your account has been successfully created.",
      body2:
        "You can now log in to the portal to submit support tickets, view knowledge base articles, and track your requests.",
      button: "Access Portal",
      questions: "If you have any questions, feel free to reply to this email.",
      regards: "Best regards",
      team: "The MC Support Team",
      rights: "All rights reserved.",
    },
    welcomeWithPassword: {
      title: "🎉 Welcome to MC Support!",
      greeting: "Hello",
      body: "Your account has been created in the Multicomputos Support System.",
      credentialsTitle: "Your login credentials:",
      emailLabel: "Email:",
      passwordLabel: "Temporary Password:",
      warningTitle: "⚠️ IMPORTANT",
      warningBody:
        'For your security, you must change your password the first time you log in. Click on your profile and select "Change password".',
      body2:
        "With your account you can submit support tickets, browse knowledge base articles, and track your requests.",
      button: "Log In",
      questions: "If you have any questions, feel free to contact us.",
      regards: "Best regards",
      team: "The MC Support Team",
    },
    ticketCreated: {
      title: "Ticket Received",
      greeting: "Hello",
      body: "We have received your support request. A ticket has been created with the following details:",
      ticketLabel: "Ticket #:",
      subjectLabel: "Subject:",
      body2:
        "Our support team will review your request and get back to you shortly.",
      button: "View Ticket",
    },
    statusChange: {
      title: "Ticket Update",
      greeting: "Hello",
      body: "The status of your ticket",
      updated: "has been updated.",
      subjectLabel: "Subject:",
      statusLabel: "New Status:",
      body2: "Please log in to the portal for more details or to reply.",
      button: "View Update",
      closeQuestion: "Was your problem resolved?",
      closeDesc:
        "If your request has been resolved successfully, you can close the ticket directly:",
      closeButton: "✅ Close Ticket",
    },
    assigned: {
      title: "Ticket Assigned",
      greeting: "Hello",
      body: "You have been assigned the following ticket:",
      body2: "Please review and take necessary action.",
      button: "Open Ticket",
    },
    escalation: {
      title: "⚠️ Urgent Escalation",
      greeting: "Hello Supervisors",
      body: "The system has automatically escalated the following ticket for immediate attention:",
      reasonLabel: "Reason:",
      sentimentLabel: "Sentiment Analysis:",
      body2: "This ticket requires urgent review and intervention.",
      button: "View Escalated Ticket",
    },
    assistantResponse: {
      title: "has responded",
      greeting: "Hello",
      body: "our virtual assistant, has reviewed your ticket",
      body2: "and sent you a message:",
      body3:
        "If you have any additional questions, you can reply directly in the portal.",
      button: "View Full Ticket",
      disclaimer:
        "This is an automated message generated by our virtual assistant. To reply, please use the support portal.",
    },
    newMessage: {
      title: "💬 New Message on your Ticket",
      greeting: "Hello",
      body: "You have received a new message on your ticket",
      fromLabel: "From:",
      body2: "To reply to this message, access the support portal.",
      button: "Reply",
    },
    vacation: {
      activatedTitle: "🏝️ Vacation Mode Activated",
      greeting: "Hello",
      activatedBody: "Your vacation mode has been activated successfully.",
      fromLabel: "📅 From:",
      untilLabel: "📅 Until:",
      ticketsReassigned: "📋 Tickets reassigned:",
      reassignedTo: "👤 Reassigned to:",
      enjoyVacation: "Enjoy your vacation! Your tickets are in good hands.",
      rights: "All rights reserved.",
      reassignmentTitle: "📋 Tickets Reassigned Due to Vacation",
      reassignmentBody: "has activated vacation mode and reassigned",
      tickets: "ticket(s)",
      vacationPeriod: "⏰ Vacation period:",
      messageLabel: "💬 Message:",
      ticketsToHandle: "Tickets to handle:",
      ticketColumn: "Ticket",
      subjectColumn: "Subject",
      priorityColumn: "Priority",
      viewTickets: "View Tickets",
      clientNotificationTitle: "ℹ️ Update on your Ticket",
      clientNotificationBody:
        "We inform you that your ticket has been reassigned to another member of our team.",
      ticketLabel: "Ticket:",
      subjectLabel: "Subject:",
      newResponsible: "New responsible:",
      reason: "Reason:",
      continuedPriority:
        "Your case remains our priority and will continue to be handled without interruptions.",
      viewMyTicket: "View my Ticket",
    },
  },
};

export const welcomeEmail = (
  name: string,
  url: string,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].welcome;
  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">${t.title}</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting} <strong>${name}</strong>,</p>
            <p>${t.body}</p>
            <p>${t.body2}</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">${t.button}</a>
            </div>
            <p>${t.questions}</p>
            <p>${t.regards},<br>${t.team}</p>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${t.rights}</p>
        </div>
    </div>
`;
};

/**
 * Email de bienvenida para nuevos usuarios con contraseña temporal
 * Incluye aviso destacado para cambiar la contraseña
 */
export const welcomeWithPasswordEmail = (
  name: string,
  email: string,
  password: string,
  url: string,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].welcomeWithPassword;
  const rights = emailTranslations[lang].welcome.rights;
  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">${t.title}</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting} <strong>${name}</strong>,</p>
            <p>${t.body}</p>
            
            <!-- Credentials Box -->
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 16px 0; color: #1e293b;">${
                  t.credentialsTitle
                }</h3>
                <p style="margin: 0 0 8px 0;"><strong>${
                  t.emailLabel
                }</strong> ${email}</p>
                <p style="margin: 0; font-size: 18px;"><strong>${
                  t.passwordLabel
                }</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
            </div>
            
            <!-- Warning Box -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 700; font-size: 16px;">${
                  t.warningTitle
                }</p>
                <p style="margin: 0; color: #78350f;">${t.warningBody}</p>
            </div>
            
            <p>${t.body2}</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">${t.button}</a>
            </div>
            <p>${t.questions}</p>
            <p>${t.regards},<br>${t.team}</p>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${rights}</p>
        </div>
    </div>
`;
};

export const ticketCreatedEmail = (
  ticketId: string,
  ticketNumber: string,
  title: string,
  url: string,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].ticketCreated;
  const rights = emailTranslations[lang].welcome.rights;
  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">${t.title}</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting},</p>
            <p>${t.body}</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>${
                  t.ticketLabel
                }</strong> ${ticketNumber}</p>
                <p style="margin: 0;"><strong>${
                  t.subjectLabel
                }</strong> ${title}</p>
            </div>
            <p>${t.body2}</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">${t.button}</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${rights}</p>
        </div>
    </div>
`;
};

// Traducciones de Estados
const statusTranslations = {
  es: {
    OPEN: "Abierto",
    IN_PROGRESS: "En Progreso",
    WAITING_CUSTOMER: "Esperando Respuesta",
    RESOLVED: "Resuelto",
    CLOSED: "Cerrado",
  },
  en: {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    WAITING_CUSTOMER: "Waiting for Customer",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  },
};

export const statusChangeEmail = (
  ticketNumber: string,
  title: string,
  newStatus: string,
  url: string,
  ticketId?: string,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].statusChange;
  const rights = emailTranslations[lang].welcome.rights;

  // Traducir el estado si existe en el diccionario, sino usar el original
  const statusLabel =
    statusTranslations[lang]?.[
      newStatus as keyof (typeof statusTranslations)["es"]
    ] || newStatus;

  // Agregar botón de cierre si el estado es WAITING_CUSTOMER
  let closeButton = "";
  if (newStatus === "WAITING_CUSTOMER" && ticketId) {
    const closeUrl = `${BASE_URL}/api/tickets/${ticketId}/close`;
    closeButton = `
            <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 10px 0; color: #0c4a6e; font-weight: 600;">${t.closeQuestion}</p>
                <p style="margin: 0 0 15px 0; color: #075985; font-size: 14px;">
                    ${t.closeDesc}
                </p>
                <div style="text-align: center;">
                    <a href="${closeUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        ${t.closeButton}
                    </a>
                </div>
            </div>
        `;
  }

  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">${t.title}</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting},</p>
            <p>${t.body} <strong>#${ticketNumber}</strong> ${t.updated}</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>${
                  t.subjectLabel
                }</strong> ${title}</p>
                <p style="margin: 0;"><strong>${
                  t.statusLabel
                }</strong> <span style="color: #f97316; font-weight: bold;">${statusLabel}</span></p>
            </div>
            ${closeButton}
            <p>${t.body2}</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">${t.button}</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${rights}</p>
        </div>
    </div>
`;
};

export const assignedEmail = (
  ticketNumber: string,
  title: string,
  url: string,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].assigned;
  const tc = emailTranslations[lang].ticketCreated;
  const rights = emailTranslations[lang].welcome.rights;
  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">${t.title}</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting},</p>
            <p>${t.body}</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>${
                  tc.ticketLabel
                }</strong> ${ticketNumber}</p>
                <p style="margin: 0;"><strong>${
                  tc.subjectLabel
                }</strong> ${title}</p>
            </div>
            <p>${t.body2}</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">${t.button}</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${rights}</p>
        </div>
    </div>
`;
};

export const escalationAlertEmail = (
  ticketNumber: string,
  alertReason: string,
  sentiment: string,
  url: string,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].escalation;
  const rights = emailTranslations[lang].welcome.rights;
  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">${t.title}</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting},</p>
            <p>${t.body}</p>
            <div style="background-color: #fee2e2; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #ef4444;">
                <p style="margin: 0 0 8px 0;"><strong>Ticket #:</strong> ${ticketNumber}</p>
                <p style="margin: 0 0 8px 0;"><strong>${
                  t.reasonLabel
                }</strong> <span style="color: #dc2626; font-weight: bold;">${alertReason}</span></p>
                <p style="margin: 0;"><strong>${
                  t.sentimentLabel
                }</strong> ${sentiment}</p>
            </div>
            <p>${t.body2}</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">${t.button}</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${rights}</p>
        </div>
    </div>
`;
};

export const assistantResponseEmail = (
  ticketNumber: string,
  assistantName: string,
  message: string,
  url: string,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].assistantResponse;
  const rights = emailTranslations[lang].welcome.rights;
  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">🤖 ${assistantName} ${
    t.title
  }</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting},</p>
            <p>${assistantName}, ${t.body} <strong>#${ticketNumber}</strong> ${
    t.body2
  }</p>
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0284c7;">
                ${message
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br>")}
            </div>
            <p>${t.body3}</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">${t.button}</a>
            </div>
            <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
                <em>${t.disclaimer}</em>
            </p>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${rights}</p>
        </div>
    </div>
`;
};

export const newMessageEmail = (
  ticketNumber: string,
  senderName: string,
  messageContent: string,
  url: string,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].newMessage;
  const rights = emailTranslations[lang].welcome.rights;
  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">${t.title}</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting},</p>
            <p>${t.body} <strong>#${ticketNumber}</strong>.</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 12px 0;"><strong>${
                  t.fromLabel
                }</strong> ${senderName}</p>
                <div style="background-color: #ffffff; padding: 16px; border-radius: 4px; border: 1px solid #e2e8f0;">
                    ${messageContent.replace(/\n/g, "<br>")}
                </div>
            </div>
            <p>${t.body2}</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.buttonBlue}">${
    t.button
  }</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${rights}</p>
        </div>
    </div>
`;
};

/**
 * Email de confirmación de vacaciones activadas
 */
export const vacationActivatedEmail = (
  userName: string,
  startDate: Date,
  endDate: Date,
  reassignedCount: number,
  reassignedTo?: string,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].vacation;
  const formatDate = (d: Date) =>
    d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">${t.activatedTitle}</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting} <strong>${userName}</strong>,</p>
            <p>${t.activatedBody}</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>${
                  t.fromLabel
                }</strong> ${formatDate(startDate)}</p>
                <p style="margin: 0;"><strong>${
                  t.untilLabel
                }</strong> ${formatDate(endDate)}</p>
            </div>
            ${
              reassignedCount > 0
                ? `
            <div style="background-color: #dbeafe; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>${
                  t.ticketsReassigned
                }</strong> ${reassignedCount}</p>
                ${
                  reassignedTo
                    ? `<p style="margin: 0;"><strong>${t.reassignedTo}</strong> ${reassignedTo}</p>`
                    : ""
                }
            </div>`
                : ""
            }
            <p>${t.enjoyVacation}</p>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${t.rights}</p>
        </div>
    </div>
`;
};

/**
 * Email para el receptor de tickets reasignados por vacaciones
 */
export const vacationReassignmentEmail = (
  receiverName: string,
  vacationUserName: string,
  tickets: Array<{ number: string; title: string; priority: string }>,
  startDate: Date,
  endDate: Date,
  vacationMessage?: string | null,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].vacation;
  const formatDate = (d: Date) =>
    d.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const ticketRows = tickets
    .map(
      (ticket) => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">#${ticket.number}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ticket.title}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${ticket.priority}</td>
        </tr>
    `
    )
    .join("");

  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">${t.reassignmentTitle}</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting} <strong>${receiverName}</strong>,</p>
            <p><strong>${vacationUserName}</strong> ${t.reassignmentBody} ${
    tickets.length
  } ${t.tickets}.</p>
            
            <div style="background-color: #fef3c7; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #f59e0b;">
                <p style="margin: 0;"><strong>${
                  t.vacationPeriod
                }</strong> ${formatDate(startDate)} - ${formatDate(endDate)}</p>
                ${
                  vacationMessage
                    ? `<p style="margin: 8px 0 0 0;"><strong>${t.messageLabel}</strong> ${vacationMessage}</p>`
                    : ""
                }
            </div>

            <h3 style="margin-top: 24px;">${t.ticketsToHandle}</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <thead>
                    <tr style="background-color: #f1f5f9;">
                        <th style="padding: 12px 8px; text-align: left;">${
                          t.ticketColumn
                        }</th>
                        <th style="padding: 12px 8px; text-align: left;">${
                          t.subjectColumn
                        }</th>
                        <th style="padding: 12px 8px; text-align: left;">${
                          t.priorityColumn
                        }</th>
                    </tr>
                </thead>
                <tbody>
                    ${ticketRows}
                </tbody>
            </table>

            <div style="text-align: center; margin: 24px 0;">
                <a href="${BASE_URL}/admin/tickets" style="${
    emailStyles.button
  }">${t.viewTickets}</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${t.rights}</p>
        </div>
    </div>
`;
};

/**
 * Email para notificar a clientes sobre reasignación por vacaciones
 */
export const vacationClientNotificationEmail = (
  clientName: string,
  ticketNumber: string,
  ticketTitle: string,
  newAssigneeName: string,
  vacationMessage?: string | null,
  ticketUrl?: string,
  lang: EmailLanguage = "es"
) => {
  const t = emailTranslations[lang].vacation;
  return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">${
    t.clientNotificationTitle
  }</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>${t.greeting} <strong>${clientName}</strong>,</p>
            <p>${t.clientNotificationBody}</p>
            
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>${
                  t.ticketLabel
                }</strong> #${ticketNumber}</p>
                <p style="margin: 0 0 8px 0;"><strong>${
                  t.subjectLabel
                }</strong> ${ticketTitle}</p>
                <p style="margin: 0;"><strong>${
                  t.newResponsible
                }</strong> ${newAssigneeName}</p>
            </div>

            ${
              vacationMessage
                ? `
            <div style="background-color: #e0f2fe; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0;"><strong>${t.reason}</strong> ${vacationMessage}</p>
            </div>`
                : ""
            }

            <p>${t.continuedPriority}</p>

            ${
              ticketUrl
                ? `
            <div style="text-align: center; margin: 24px 0;">
                <a href="${ticketUrl}" style="${emailStyles.button}">${t.viewMyTicket}</a>
            </div>`
                : ""
            }
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. ${t.rights}</p>
        </div>
    </div>
`;
};
