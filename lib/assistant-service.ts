import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { sendEmail } from "./email-service"
import { escalationAlertEmail } from "./email-templates"

const ASSISTANT_EMAIL = 'lau@mcsupport.bot';

export class AssistantService {

    /**
     * Obtiene el usuario del asistente desde la BD.
     * Si no existe, retorna null.
     */
    static async getAssistantUser() {
        return await prisma.user.findUnique({
            where: { email: ASSISTANT_EMAIL }
        });
    }

    /**
     * Verifica si el asistente está habilitado en la configuración del sistema.
     */
    static async isEnabled() {
        const config = await prisma.systemConfig.findFirst();
        return config?.assistantEnabled ?? true; // Default to true if no config
    }

    /**
     * Detecta el idioma del texto basado en palabras clave comunes
     */
    static detectLanguage(text: string): 'es' | 'en' {
        const englishWords = /\b(the|is|are|was|were|have|has|will|can|could|would|should|my|your|this|that|with|from|they|been|more|when|who|which|their|if|do|does)\b/gi;
        const spanishWords = /\b(el|la|los|las|un|una|es|son|fue|fueron|tiene|tengo|sera|puede|podria|como|cuando|donde|quien|que|con|para|por|su|sus|mi|mis)\b/gi;

        const englishMatches = (text.match(englishWords) || []).length;
        const spanishMatches = (text.match(spanishWords) || []).length;

        // Si hay match, usar el que tenga más coincidencias
        if (englishMatches > 0 || spanishMatches > 0) {
            return englishMatches > spanishMatches ? 'en' : 'es';
        }

        // Default a español si no se detecta
        return 'es';
    }

    /**
     * Genera un saludo basado en la hora del día
     */
    static getTimeBasedGreeting(language: 'es' | 'en'): string {
        const hour = new Date().getHours();

        if (language === 'es') {
            if (hour >= 5 && hour < 12) return 'Buenos días';
            if (hour >= 12 && hour < 19) return 'Buenas tardes';
            return 'Buenas noches';
        } else {
            if (hour >= 5 && hour < 12) return 'Good morning';
            if (hour >= 12 && hour < 18) return 'Good afternoon';
            return 'Good evening';
        }
    }

    /**
     * Analiza el contenido del ticket para determinar prioridad y tags (simulado).
     */
    static analyzeTicketContent(title: string, description: string) {
        const text = (title + " " + description).toLowerCase();
        let priority = null;
        let sentiment = 'NEUTRAL';

        // Reglas de Sentimiento (Básico)
        const negativeKeywords = ['terrible', 'pésimo', 'inútil', 'basura', 'disappointed', 'angry', 'molesto', 'enfadado', 'urgencia', 'inaceptable', 'vergüenza', 'horrible', 'awful', 'useless', 'frustrated', 'frustrado'];
        if (negativeKeywords.some(w => text.includes(w))) {
            sentiment = 'NEGATIVE';
        }

        // Reglas de Prioridad
        if (text.includes("urgente") || text.includes("crítico") || text.includes("critical") || text.includes("urgent")) {
            priority = 'HIGH';
        }
        if (text.includes("sistema caído") || text.includes("down") || text.includes("sin servicio") || text.includes("not working") || text.includes("no funciona")) {
            priority = 'CRITICAL';
        }
        if (text.includes("pregunta") || text.includes("duda") || text.includes("cómo") || text.includes("question") || text.includes("how to")) {
            priority = 'LOW';
        }

        return { priority, sentiment };
    }

    /**
     * Busca artículos relevantes basados en palabras clave del título.
     */
    static async suggestArticles(query: string) {
        const terms = query.split(' ').filter(t => t.length > 3);
        if (terms.length === 0) return [];

        const articles = await prisma.article.findMany({
            where: {
                OR: terms.map(term => ({
                    title: {
                        contains: term,
                        mode: 'insensitive'
                    }
                })),
                isPublished: true
            },
            take: 3,
            select: {
                title: true,
                slug: true
            }
        });

        return articles;
    }

    /**
     * Genera el mensaje de bienvenida con variación y contexto
     */
    static generateWelcomeMessage(params: {
        creatorName: string;
        assistantName: string;
        ticketNumber: string;
        language: 'es' | 'en';
        isBusinessHours: boolean;
        analysis: { priority: string | null; sentiment: string };
        suggestions: Array<{ title: string; slug: string }>;
        priorityChanged: boolean;
    }) {
        const { creatorName, assistantName, ticketNumber, language, isBusinessHours, analysis, suggestions, priorityChanged } = params;

        const greeting = this.getTimeBasedGreeting(language);

        // Templates variados para español
        const templatesES = [
            `${greeting} ${creatorName} 👋, soy ${assistantName}, tu asistente virtual. He recibido tu solicitud **#${ticketNumber}**.`,
            `Hola ${creatorName}, ¡ya recibí tu caso! Soy ${assistantName} y estaré atenta a tu ticket **#${ticketNumber}**.`,
            `${greeting} ${creatorName}, gracias por contactarnos. Soy ${assistantName}, y he registrado tu solicitud **#${ticketNumber}**.`
        ];

        // Templates variados para inglés
        const templatesEN = [
            `${greeting} ${creatorName} 👋, I'm ${assistantName}, your virtual assistant. I've received your request **#${ticketNumber}**.`,
            `Hello ${creatorName}, I've got your case! I'm ${assistantName} and I'll be monitoring your ticket **#${ticketNumber}**.`,
            `${greeting} ${creatorName}, thanks for reaching out. I'm ${assistantName}, and I've registered your request **#${ticketNumber}**.`
        ];

        // Seleccionar template aleatorio
        const templates = language === 'es' ? templatesES : templatesEN;
        const openingMessage = templates[Math.floor(Math.random() * templates.length)];

        // Mensaje de prioridad (solo si cambió por keywords, no por sentimiento)
        let priorityMessage = "";
        if (priorityChanged && analysis.sentiment !== 'NEGATIVE') {
            if (language === 'es') {
                priorityMessage = `\n\n*Nota: He actualizado la prioridad a **${analysis.priority}** basándome en los details de tu descripción.*`;
            } else {
                priorityMessage = `\n\n*Note: I've updated the priority to **${analysis.priority}** based on your description.*`;
            }
        }

        // Mensaje de estado según contexto
        let statusMessage = "";

        if (analysis.sentiment === 'NEGATIVE') {
            // Sentimiento negativo - mensaje empático y urgente
            if (language === 'es') {
                statusMessage = "\n\nEntiendo que esto es frustrante y lamento los inconvenientes. He escalado tu caso con **prioridad alta** a nuestro equipo de supervisores para una revisión inmediata. ✅";
            } else {
                statusMessage = "\n\nI understand this is frustrating and I'm sorry for the inconvenience. I've escalated your case with **high priority** to our supervisors for immediate review. ✅";
            }
        } else if (analysis.priority === 'CRITICAL') {
            // Prioridad crítica
            if (language === 'es') {
                statusMessage = "\n\nHe marcado tu caso como **crítico** y nuestro equipo técnico ha sido notificado inmediatamente. Estamos priorizando tu solicitud. 🔍";
            } else {
                statusMessage = "\n\nI've marked your case as **critical** and our technical team has been notified immediately. We're prioritizing your request. 🔍";
            }
        } else if (!isBusinessHours) {
            // Fuera de horario
            if (language === 'es') {
                statusMessage = "\n\nTe escribo fuera de nuestro horario laboral, pero no te preocupes - tu caso ha sido registrado y quedará en la fila prioritaria para primera hora de mañana.";
            } else {
                statusMessage = "\n\nI'm writing you outside our business hours, but don't worry - your case has been logged and will be prioritized first thing tomorrow morning.";
            }
        } else {
            // Horario normal
            if (language === 'es') {
                const normalMessages = [
                    "\n\nHe revisado los detalles de tu solicitud y ya está en manos de nuestro equipo. Te mantendremos informado del progreso.",
                    "\n\nUn miembro de nuestro equipo revisará tu caso a la brevedad y te contactará con actualizaciones.",
                    "\n\nTu solicitud está ahora con nuestro equipo técnico. Recibirás noticias pronto sobre el siguiente paso."
                ];
                statusMessage = normalMessages[Math.floor(Math.random() * normalMessages.length)];
            } else {
                const normalMessages = [
                    "\n\nI've reviewed your request details and it's now with our team. We'll keep you informed of progress.",
                    "\n\nA member of our team will review your case shortly and contact you with updates.",
                    "\n\nYour request is now with our technical team. You'll hear back soon about next steps."
                ];
                statusMessage = normalMessages[Math.floor(Math.random() * normalMessages.length)];
            }
        }

        // Sugerencias de artículos
        let suggestionText = "";
        if (suggestions.length > 0) {
            if (language === 'es') {
                suggestionText = "\n\n**Tal vez estos artículos te sean útiles mientras esperas:**\n";
                suggestions.forEach(art => {
                    suggestionText += `- [${art.title}](/portal/kb/${art.slug})\n`;
                });
            } else {
                suggestionText = "\n\n**These articles might be helpful while you wait:**\n";
                suggestions.forEach(art => {
                    suggestionText += `- [${art.title}](/portal/kb/${art.slug})\n`;
                });
            }
        }

        // Cierre
        let closing = "";
        if (language === 'es') {
            const closings = [
                "\n\nSi tienes detalles adicionales, no dudes en responder a este mensaje. 😊",
                "\n\n¿Algo más que agregar? Responde aquí y lo veremos de inmediato.",
                "\n\nCualquier información adicional que quieras compartir, déjala en este chat."
            ];
            closing = closings[Math.floor(Math.random() * closings.length)];
        } else {
            const closings = [
                "\n\nIf you have any additional details, feel free to reply to this message. 😊",
                "\n\nAnything else to add? Reply here and we'll see it right away.",
                "\n\nAny additional information you'd like to share, just leave it in this chat."
            ];
            closing = closings[Math.floor(Math.random() * closings.length)];
        }

        return `${openingMessage}${priorityMessage}${statusMessage}${suggestionText}${closing}`;
    }

    /**
     * Procesa el evento de "Ticket Creado".
     * - Espera 30 segundos (simula tiempo de lectura/análisis humano)
     * - Analiza y actualiza prioridad si es necesario
     * - Detecta idioma y responde apropiadamente
     * - Busca artículos sugeridos
     * - Publica un mensaje de bienvenida enriquecido y humanizado
     */
    static async processTicketCreation(ticketId: string, ticketNumber: string, creatorName: string, title: string, description: string) {
        try {
            if (!(await this.isEnabled())) {
                logger.info(`[Assistant] Disabled, skipping ticket ${ticketNumber}`);
                return;
            }

            const assistant = await this.getAssistantUser();
            if (!assistant) {
                logger.error("[Assistant] User 'LAU' not found. Please run seed.");
                return;
            }

            const config = await prisma.systemConfig.findFirst();
            const assistantName = config?.assistantName || assistant.name || 'LAU';

            // ⏰ DELAY: Espera 30 segundos antes de responder (más humano)
            await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

            // 🌍 Detectar idioma del ticket
            const language = this.detectLanguage(title + " " + description);
            logger.info(`[Assistant] Detected language: ${language} for ticket ${ticketNumber}`);

            // ⏰ Business Hours Logic
            const currentHour = new Date().getHours();
            const startHour = config?.businessHoursStart ?? 9;
            const endHour = config?.businessHoursEnd ?? 18;
            const isBusinessHours = currentHour >= startHour && currentHour < endHour;

            // 📊 Análisis de Contenido (Sentimiento y Prioridad)
            const analysis = this.analyzeTicketContent(title, description);
            let priorityChanged = false;

            if (analysis.sentiment === 'NEGATIVE') {
                // Sentimiento negativo sube prioridad a HIGH mínimo
                if (!analysis.priority || analysis.priority === 'LOW' || analysis.priority === 'MEDIUM') {
                    analysis.priority = 'HIGH';
                    priorityChanged = true;
                }
            }

            if (analysis.priority) {
                const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
                if (validPriorities.includes(analysis.priority)) {
                    await prisma.case.update({
                        where: { id: ticketId },
                        data: {
                            priority: analysis.priority as any,
                            sentiment: analysis.sentiment as any
                        }
                    });
                    logger.info(`[Assistant] Updated priority for ${ticketNumber} to ${analysis.priority} (Sentiment: ${analysis.sentiment})`);
                }
            }

            // 📧 Alerta de Escalado Inteligente (solo emails internos, NO mensajes en chat)
            if (analysis.priority === 'CRITICAL' || analysis.sentiment === 'NEGATIVE') {
                const alertReason = analysis.priority === 'CRITICAL' ? 'Critical System Failure Detected' : 'Customer Distress/Negative Sentiment';
                const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/tickets/${ticketId}`;

                await sendEmail({
                    to: config?.supportEmail || 'support@multicomputos.com',
                    subject: `[URGENTE] Escalado Automático - Ticket #${ticketNumber}`,
                    body: escalationAlertEmail(ticketNumber, alertReason, analysis.sentiment, ticketUrl)
                });
                logger.info(`[Assistant] Sent escalation alert for ${ticketNumber}`);
            }

            // 🔍 Búsqueda de Artículos (RAG Básico)
            const suggestions = await this.suggestArticles(title);

            // ✍️ Generar mensaje personalizado
            const welcomeMessage = this.generateWelcomeMessage({
                creatorName,
                assistantName,
                ticketNumber,
                language,
                isBusinessHours,
                analysis,
                suggestions,
                priorityChanged
            });

            // 💬 Crear mensaje de bienvenida (visible al cliente)
            await prisma.message.create({
                data: {
                    content: welcomeMessage,
                    ticketId: ticketId,
                    senderId: assistant.id,
                    isInternal: false, // Visible al cliente
                }
            });

            // 📧 Notificar al cliente por email
            const ticket = await prisma.case.findUnique({
                where: { id: ticketId },
                include: { user: true }
            });

            if (ticket?.user?.email) {
                const { assistantResponseEmail } = await import('./email-templates');
                await sendEmail({
                    to: ticket.user.email,
                    subject: `${assistantName} ha respondido tu ticket #${ticketNumber}`,
                    body: assistantResponseEmail(
                        ticketNumber,
                        assistantName,
                        welcomeMessage,
                        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/portal/tickets/${ticketId}`
                    )
                });
                logger.info(`[Assistant] Sent email notification to ${ticket.user.email} for ticket ${ticketNumber}`);
            }

            logger.info(`[Assistant] Processed ticket ${ticketNumber} successfully (Language: ${language})`);

        } catch (error) {
            logger.error(`[Assistant] Failed to process ticket creation for ${ticketNumber}`, { error });
        }
    }
}
