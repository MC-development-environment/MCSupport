/**
 * Asistente Virtual LAU - Analizador de Contenido
 * Análisis de contenido: idioma, categoría, prioridad, sentimiento
 */

import type {
  Language,
  TicketCategory,
  TicketPriority,
  Sentiment,
  ContentAnalysis,
} from "./types";
import {
  CATEGORY_KEYWORDS,
  PRIORITY_KEYWORDS,
  NEGATIVE_SENTIMENT_KEYWORDS,
  LANGUAGE_DETECTION,
  CATEGORY_PRIORITY_ORDER,
} from "./constants";

/**
 * Detecta el idioma del texto basado en palabras clave
 */
export function detectLanguage(text: string): Language {
  const englishMatches = (text.match(LANGUAGE_DETECTION.english) || []).length;
  const spanishMatches = (text.match(LANGUAGE_DETECTION.spanish) || []).length;

  if (englishMatches > 0 || spanishMatches > 0) {
    return englishMatches > spanishMatches ? "en" : "es";
  }

  return "es"; // Default español
}

/**
 * Clasifica el ticket en una categoría basado en keywords
 * IMPORTANTE: Evalúa categorías en orden de prioridad (SERVICE_COMPLAINT primero)
 * Si hay sentimiento negativo, aumenta la probabilidad de SERVICE_COMPLAINT
 */
export function classifyCategory(
  text: string,
  sentiment?: Sentiment
): { category: TicketCategory; confidence: number } {
  const lowerText = text.toLowerCase();
  const scores: Record<string, number> = {};

  // Calcular score por categoría
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      // Dar mayor peso a matches exactos de frases largas
      const keywordLower = keyword.toLowerCase();
      if (lowerText.includes(keywordLower)) {
        // Frases de más de una palabra valen más
        const wordCount = keywordLower.split(" ").length;
        matchCount += wordCount; // 'mal servicio' = 2 puntos
      }
    }
    scores[category] = matchCount;
  }

  // Si hay sentimiento negativo, boost a SERVICE_COMPLAINT
  if (sentiment === "NEGATIVE") {
    scores["SERVICE_COMPLAINT"] = (scores["SERVICE_COMPLAINT"] || 0) + 2;
  }

  // Encontrar la categoría con mayor score siguiendo orden de prioridad
  // En caso de empate, gana la que tiene mayor prioridad
  let maxCategory: TicketCategory = "OTHER";
  let maxScore = 0;

  // Evaluar en orden de prioridad definido
  for (const category of CATEGORY_PRIORITY_ORDER) {
    const score = scores[category] || 0;
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category as TicketCategory;
    } else if (score === maxScore && score > 0) {
      // En caso de empate, la primera en el orden de prioridad gana
      // (ya está siendo evaluada primero)
    }
  }

  // Calcular confianza (0-100)
  const confidence =
    maxScore > 0 ? Math.min(100, Math.round((maxScore / 3) * 100)) : 0;

  return { category: maxCategory, confidence };
}

/**
 * Detecta la prioridad basada en keywords
 */
export function detectPriority(text: string): TicketPriority | null {
  const lowerText = text.toLowerCase();

  // Verificar CRITICAL primero
  for (const keyword of PRIORITY_KEYWORDS.CRITICAL) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return "CRITICAL";
    }
  }

  // Verificar HIGH
  for (const keyword of PRIORITY_KEYWORDS.HIGH) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return "HIGH";
    }
  }

  // Verificar LOW
  for (const keyword of PRIORITY_KEYWORDS.LOW) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return "LOW";
    }
  }

  return null; // No detectado, usar default
}

/**
 * Detecta el sentimiento del texto
 */
export function detectSentiment(text: string): Sentiment {
  const lowerText = text.toLowerCase();

  for (const keyword of NEGATIVE_SENTIMENT_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return "NEGATIVE";
    }
  }

  return "NEUTRAL";
}

/**
 * Análisis completo del contenido del ticket
 * ORDEN: Sentimiento → Categoría (con boost de sentimiento) → Prioridad
 */
export function analyzeContent(
  title: string,
  description: string
): ContentAnalysis {
  const fullText = `${title} ${description}`;

  // 1. Detectar sentimiento PRIMERO
  const sentiment = detectSentiment(fullText);

  // 2. Clasificar categoría PASANDO el sentimiento (para boost de SERVICE_COMPLAINT)
  const { category, confidence } = classifyCategory(fullText, sentiment);

  // 3. Detectar prioridad
  let priority = detectPriority(fullText);

  // Si sentimiento es negativo, subir prioridad
  if (sentiment === "NEGATIVE") {
    if (!priority || priority === "LOW" || priority === "MEDIUM") {
      priority = "HIGH";
    }
  }

  return {
    priority,
    sentiment,
    category,
    confidence,
  };
}
