/**
 * Asistente Virtual LAU - Respondedor KB
 * Respuestas automáticas basadas en la Base de Conocimientos
 * Issue 5: Lógica mejorada para evitar sugerencias irrelevantes
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { Language, KBArticleMatch, KBResponseResult } from "./types";
import { DEFAULT_CONFIG } from "./constants";
import { KB_MESSAGES, formatMessage } from "./messages";

// Stop words comunes que no deben usarse para matching (Issue 5)
const STOP_WORDS = new Set([
  // Español
  "sistema",
  "error",
  "problema",
  "datos",
  "información",
  "usuario",
  "caso",
  "tipo",
  "estado",
  "forma",
  "modo",
  "parte",
  "proceso",
  "solicitud",
  "ticket",
  "soporte",
  "ayuda",
  "favor",
  "gracias",
  "hola",
  "buenas",
  "correo",
  "email",
  "necesito",
  "tengo",
  "quiero",
  "puedo",
  "cuando",
  "donde",
  "como",
  "porque",
  "mensaje",
  "archivo",
  "adjunto",
  "enviar",
  "guardar",
  "crear",
  "cambiar",
  "actualizar",
  "resultado",
  "esperado",
  "impacto",
  "comportamiento",
  // English
  "system",
  "error",
  "problem",
  "data",
  "information",
  "user",
  "case",
  "type",
  "state",
  "form",
  "mode",
  "part",
  "process",
  "request",
  "ticket",
  "support",
  "help",
  "please",
  "thanks",
  "hello",
  "email",
  "mail",
  "need",
  "have",
  "want",
  "when",
  "where",
  "what",
  "because",
  "message",
  "file",
  "attachment",
  "send",
  "save",
  "create",
  "change",
  "update",
  "result",
  "expected",
  "impact",
  "behavior",
]);

// Configuración de umbral mínimo para sugerencias
const MIN_RELEVANCE_SCORE = 30; // Mínimo 30% de relevancia
const MIN_MATCHING_TERMS = 2; // Mínimo 2 términos coincidentes
const MIN_WORD_LENGTH = 5; // Palabras de 5+ caracteres (antes era 4)

/**
 * Busca artículos relevantes con scoring de relevancia mejorado
 * Issue 5: Algoritmo más estricto para evitar falsos positivos
 */
export async function findRelevantArticles(
  title: string,
  description: string,
  limit: number = 3
): Promise<KBArticleMatch[]> {
  try {
    // Extraer términos de búsqueda significativos
    const fullText = `${title} ${description}`;
    const terms = fullText
      .toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, " ") // Limpiar caracteres especiales
      .split(/\s+/)
      .filter(
        (t) => t.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(t) // Excluir stop words
      )
      .slice(0, 8); // Limitar a 8 términos significativos

    // Si no hay suficientes términos significativos, no sugerir nada
    if (terms.length < MIN_MATCHING_TERMS) {
      logger.info("[LAU] KB search: Not enough significant terms", { terms });
      return [];
    }

    logger.info("[LAU] KB search terms after filtering", { terms });

    // Buscar artículos que coincidan con algún término
    const articles = await prisma.article.findMany({
      where: {
        isPublished: true,
        OR: [
          // Coincidencias en título (más peso)
          ...terms.map((term) => ({
            title: { contains: term, mode: "insensitive" as const },
          })),
          // Coincidencias en contenido
          ...terms.map((term) => ({
            content: { contains: term, mode: "insensitive" as const },
          })),
        ],
      },
      take: limit * 3, // Buscar más para filtrar después
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
      },
    });

    // Calcular score de relevancia con nuevo algoritmo
    const scoredArticles: KBArticleMatch[] = articles.map((article) => {
      let score = 0;
      let matchingTerms = 0;
      const lowerTitle = article.title.toLowerCase();
      const lowerContent = article.content.toLowerCase();

      for (const term of terms) {
        const titleMatch = lowerTitle.includes(term);
        const contentMatch = lowerContent.includes(term);

        if (titleMatch || contentMatch) {
          matchingTerms++;
        }

        // Título tiene 3x más peso
        if (titleMatch) score += 30;
        // Contenido tiene 1x peso
        if (contentMatch) score += 10;
      }

      // Normalizar score a 0-100
      const maxPossibleScore = terms.length * 40; // 30 + 10 por término
      const normalizedScore = Math.min(
        100,
        Math.round((score / maxPossibleScore) * 100)
      );

      // Generar extracto (primeros 200 caracteres relevantes)
      const excerpt = generateExcerpt(article.content, terms);

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt,
        relevanceScore: normalizedScore,
        _matchingTerms: matchingTerms, // Para filtrado interno
      } as KBArticleMatch & { _matchingTerms: number };
    });

    // Filtrar artículos con mínimos requeridos (Issue 5)
    const filteredArticles = scoredArticles.filter(
      (a) =>
        a.relevanceScore >= MIN_RELEVANCE_SCORE &&
        (a as KBArticleMatch & { _matchingTerms: number })._matchingTerms >=
          MIN_MATCHING_TERMS
    );

    // Log para debugging
    if (filteredArticles.length === 0 && scoredArticles.length > 0) {
      logger.info("[LAU] KB articles filtered out due to low relevance", {
        articlesFound: scoredArticles.length,
        scores: scoredArticles.map((a) => ({
          title: a.title,
          score: a.relevanceScore,
          terms: (a as KBArticleMatch & { _matchingTerms: number })
            ._matchingTerms,
        })),
      });
    }

    // Ordenar por score y limitar, removiendo campo interno
    return filteredArticles
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
      .map((a) => {
        const { id, title, slug, excerpt, relevanceScore } = a;
        return { id, title, slug, excerpt, relevanceScore };
      });
  } catch (error) {
    logger.error("[LAU] Error searching KB articles", { error });
    return [];
  }
}

/**
 * Genera un extracto del artículo enfocado en los términos de búsqueda
 */
function generateExcerpt(content: string, terms: string[]): string {
  // Limpiar markdown básico
  const cleanContent = content
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n+/g, " ")
    .trim();

  // Buscar la primera ocurrencia de algún término
  let startIndex = 0;
  for (const term of terms) {
    const index = cleanContent.toLowerCase().indexOf(term.toLowerCase());
    if (index !== -1) {
      startIndex = Math.max(0, index - 50);
      break;
    }
  }

  // Extraer 200 caracteres desde ese punto
  let excerpt = cleanContent.substring(startIndex, startIndex + 200);

  // Limpiar inicio y fin
  if (startIndex > 0) excerpt = "..." + excerpt;
  if (startIndex + 200 < cleanContent.length) excerpt = excerpt + "...";

  return excerpt;
}

/**
 * Genera una respuesta automática basada en un artículo KB
 */
export async function generateKBResponse(
  ticketId: string,
  title: string,
  description: string,
  language: Language,
  threshold: number = DEFAULT_CONFIG.kbRelevanceThreshold
): Promise<KBResponseResult> {
  try {
    const articles = await findRelevantArticles(title, description, 3);

    // No hay artículos relevantes
    if (articles.length === 0) {
      return {
        hasRelevantArticle: false,
        autoResponded: false,
      };
    }

    const topArticle = articles[0];

    // Si el artículo más relevante supera el umbral → respuesta automática
    if (topArticle.relevanceScore >= threshold) {
      const articleUrl = `/portal/kb/${topArticle.slug}`;

      const responseMessage = formatMessage(
        KB_MESSAGES.autoResponse[language],
        {
          excerpt: topArticle.excerpt,
          url: articleUrl,
        }
      );

      logger.info(`[LAU] KB auto-response triggered for ticket ${ticketId}`, {
        articleId: topArticle.id,
        relevanceScore: topArticle.relevanceScore,
      });

      return {
        hasRelevantArticle: true,
        article: topArticle,
        responseMessage,
        autoResponded: true,
      };
    }

    // Relevancia bajo umbral → solo sugerir
    return {
      hasRelevantArticle: true,
      article: topArticle,
      autoResponded: false,
    };
  } catch (error) {
    logger.error("[LAU] Error generating KB response", { error });
    return {
      hasRelevantArticle: false,
      autoResponded: false,
    };
  }
}

/**
 * Genera texto de sugerencias de artículos para incluir en mensaje
 */
export function generateSuggestionsText(
  articles: KBArticleMatch[],
  language: Language
): string {
  if (articles.length === 0) return "";

  let text = KB_MESSAGES.suggestion[language];

  for (const article of articles) {
    text += `- [${article.title}](/portal/kb/${article.slug})\n`;
  }

  return text;
}
