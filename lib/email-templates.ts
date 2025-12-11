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
        background-color: #0f172a;
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
        background-color: #f8fafc;
        padding: 16px;
        text-align: center;
        font-size: 12px;
        color: #64748b;
        border-top: 1px solid #e2e8f0;
    `,
    button: `
        display: inline-block;
        background-color: #f97316;
        color: #ffffff;
        padding: 12px 24px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        margin-top: 16px;
    `,
    highlight: `
        color: #0f172a;
        font-weight: 600;
    `
};

export const welcomeEmail = (name: string, url: string) => `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">Welcome to MC Support</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Welcome to the Multicomputos Support System. Your account has been successfully created.</p>
            <p>You can now log in to the portal to submit support tickets, view knowledge base articles, and track your requests.</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">Access Portal</a>
            </div>
            <p>If you have any questions, feel free to reply to this email.</p>
            <p>Best regards,<br>The MC Support Team</p>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. All rights reserved.</p>
        </div>
    </div>
`;

export const ticketCreatedEmail = (ticketId: string, ticketNumber: string, title: string, url: string) => `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">Ticket Received</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>Hello,</p>
            <p>We have received your support request. A ticket has been created with the following details:</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Ticket #:</strong> ${ticketNumber}</p>
                <p style="margin: 0;"><strong>Subject:</strong> ${title}</p>
            </div>
            <p>Our support team will review your request and get back to you shortly.</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">View Ticket</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. All rights reserved.</p>
        </div>
    </div>
`;

export const statusChangeEmail = (ticketNumber: string, title: string, newStatus: string, url: string, ticketId?: string) => {
    // Agregar botón de cierre si el estado es WAITING_CUSTOMER
    let closeButton = '';
    if (newStatus === 'WAITING_CUSTOMER' && ticketId) {
        const closeUrl = `${process.env.NEXTAUTH_URL}/api/tickets/${ticketId}/close`;
        closeButton = `
            <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0 0 10px 0; color: #0c4a6e; font-weight: 600;">¿Tu problema fue resuelto?</p>
                <p style="margin: 0 0 15px 0; color: #075985; font-size: 14px;">
                    Si tu solicitud ha sido atendida satisfactoriamente, puedes cerrar el ticket directamente:
                </p>
                <div style="text-align: center;">
                    <a href="${closeUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                        ✅ Cerrar Ticket
                    </a>
                </div>
            </div>
        `;
    }

    return `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">Ticket Update</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>Hello,</p>
            <p>The status of your ticket <strong>#${ticketNumber}</strong> has been updated.</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${title}</p>
                <p style="margin: 0;"><strong>New Status:</strong> <span style="color: #f97316; font-weight: bold;">${newStatus}</span></p>
            </div>
            ${closeButton}
            <p>Please log in to the portal for more details or to reply.</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">View Update</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. All rights reserved.</p>
        </div>
    </div>
`;
};


export const assignedEmail = (ticketNumber: string, title: string, url: string) => `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">Ticket Assigned</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>Hello,</p>
            <p>You have been assigned the following ticket:</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Ticket #:</strong> ${ticketNumber}</p>
                <p style="margin: 0;"><strong>Subject:</strong> ${title}</p>
            </div>
            <p>Please review and take necessary action.</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">Open Ticket</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. All rights reserved.</p>
        </div>
    </div>
`;

export const escalationAlertEmail = (ticketNumber: string, alertReason: string, sentiment: string, url: string) => `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">⚠️ Urgent Escalation</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>Hello Supervisors,</p>
            <p>The system has automatically escalated the following ticket for immediate attention:</p>
            <div style="background-color: #fee2e2; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #ef4444;">
                <p style="margin: 0 0 8px 0;"><strong>Ticket #:</strong> ${ticketNumber}</p>
                <p style="margin: 0 0 8px 0;"><strong>Reason:</strong> <span style="color: #dc2626; font-weight: bold;">${alertReason}</span></p>
                <p style="margin: 0;"><strong>Sentiment Analysis:</strong> ${sentiment}</p>
            </div>
            <p>This ticket requires urgent review and intervention.</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">View Escalated Ticket</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. All rights reserved.</p>
        </div>
    </div>
`;

export const assistantResponseEmail = (ticketNumber: string, assistantName: string, message: string, url: string) => `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">🤖 ${assistantName} ha respondido</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>Hola,</p>
            <p>${assistantName}, nuestra asistente virtual, ha revisado tu ticket <strong>#${ticketNumber}</strong> y te ha enviado un mensaje:</p>
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0284c7;">
                ${message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
            </div>
            <p>Si tienes alguna pregunta adicional, puedes responder directamente en el portal.</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">Ver Ticket Completo</a>
            </div>
            <p style="font-size: 14px; color: #64748b; margin-top: 24px;">
                <em>Este es un mensaje automático generado por nuestro asistente virtual. Para responder, por favor usa el portal de soporte.</em>
            </p>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. All rights reserved.</p>
        </div>
    </div>
`;

export const newMessageEmail = (ticketNumber: string, senderName: string, messageContent: string, url: string) => `
    <div style="${emailStyles.container}">
        <div style="${emailStyles.header}">
            <h1 style="${emailStyles.headerText}">💬 Nuevo Mensaje en tu Ticket</h1>
        </div>
        <div style="${emailStyles.body}">
            <p>Hola,</p>
            <p>Has recibido un nuevo mensaje en tu ticket <strong>#${ticketNumber}</strong>.</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 0 0 12px 0;"><strong>De:</strong> ${senderName}</p>
                <div style="background-color: #ffffff; padding: 16px; border-radius: 4px; border: 1px solid #e2e8f0;">
                    ${messageContent.replace(/\n/g, '<br>')}
                </div>
            </div>
            <p>Para responder a este mensaje, accede al portal de soporte.</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${url}" style="${emailStyles.button}">Responder</a>
            </div>
        </div>
        <div style="${emailStyles.footer}">
            <p>&copy; ${new Date().getFullYear()} Multicomputos. All rights reserved.</p>
        </div>
    </div>
`;
