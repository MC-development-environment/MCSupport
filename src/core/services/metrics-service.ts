/**
 * Servicio de Monitoreo de Rendimiento y Métricas
 *
 * Rastrea métricas de aplicación, rendimiento y KPIs de negocio
 */

import { logger } from "@/infrastructure/logging/logger";

export enum MetricType {
  COUNTER = "counter", // Valor incremental (ej., total tickets creados)
  GAUGE = "gauge", // Valor actual (ej., sesiones activas)
  HISTOGRAM = "histogram", // Distribución de valores (ej., tiempos de respuesta)
  TIMING = "timing", // Mediciones de tiempo específicas
}

interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface TimingStart {
  name: string;
  startTime: number;
  labels?: Record<string, string>;
}

class MetricsService {
  private metrics: Metric[] = [];
  private timings: Map<string, TimingStart> = new Map();
  private readonly maxMetrics = 10000; // Prevenir problemas de memoria

  /**
   * Incrementa un contador
   */
  incrementCounter(
    name: string,
    value: number = 1,
    labels?: Record<string, string>,
  ) {
    this.recordMetric({
      name,
      type: MetricType.COUNTER,
      value,
      timestamp: Date.now(),
      labels,
    });
  }

  /**
   * Registra un valor gauge (snapshot actual)
   */
  recordGauge(name: string, value: number, labels?: Record<string, string>) {
    this.recordMetric({
      name,
      type: MetricType.GAUGE,
      value,
      timestamp: Date.now(),
      labels,
    });
  }

  /**
   * Registra un valor en un histograma
   */
  recordHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ) {
    this.recordMetric({
      name,
      type: MetricType.HISTOGRAM,
      value,
      timestamp: Date.now(),
      labels,
    });
  }

  /**
   * Inicia medición de tiempo
   */
  startTiming(name: string, labels?: Record<string, string>): string {
    const timingId = `${name}_${Date.now()}_${Math.random()}`;
    this.timings.set(timingId, {
      name,
      startTime: Date.now(),
      labels,
    });
    return timingId;
  }

  /**
   * Finaliza medición de tiempo y registra métrica
   */
  endTiming(timingId: string): number | null {
    const timing = this.timings.get(timingId);
    if (!timing) {
      logger.warn(`Timing not found: ${timingId}`);
      return null;
    }

    const duration = Date.now() - timing.startTime;
    this.recordMetric({
      name: timing.name,
      type: MetricType.TIMING,
      value: duration,
      timestamp: Date.now(),
      labels: timing.labels,
    });

    this.timings.delete(timingId);
    return duration;
  }

  /**
   * Helper para medir tiempo de ejecución de una función
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>,
  ): Promise<T> {
    const timingId = this.startTiming(name, labels);
    try {
      const result = await fn();
      const duration = this.endTiming(timingId);
      logger.info(`[Metrics] ${name} completed in ${duration}ms`, {
        duration,
        labels,
      });
      return result;
    } catch (error) {
      this.endTiming(timingId);
      this.incrementCounter(`${name}_error`, 1, labels);
      throw error;
    }
  }

  /**
   * Registra una métrica
   */
  private recordMetric(metric: Metric) {
    this.metrics.push(metric);

    // Registrar métricas importantes
    if (metric.type === MetricType.TIMING && metric.value > 5000) {
      logger.warn(
        `Slow operation detected: ${metric.name} took ${metric.value}ms`,
        {
          metric,
        },
      );
    }

    // Limpiar métricas viejas para prevenir fugas de memoria
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2);
    }
  }

  /**
   * Obtiene métricas recientes
   */
  getRecentMetrics(
    name?: string,
    type?: MetricType,
    limit: number = 100,
  ): Metric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter((m) => m.name === name);
    }

    if (type) {
      filtered = filtered.filter((m) => m.type === type);
    }

    return filtered.slice(-limit);
  }

  /**
   * Calcula estadísticas para métricas de timing/histogram
   */
  getStats(
    name: string,
    type: MetricType = MetricType.TIMING,
  ): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.metrics.filter(
      (m) => m.name === name && m.type === type,
    );

    if (metrics.length === 0) return null;

    const values = metrics.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    const getPercentile = (p: number) => {
      const index = Math.ceil((values.length * p) / 100) - 1;
      return values[Math.max(0, index)];
    };

    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      p50: getPercentile(50),
      p95: getPercentile(95),
      p99: getPercentile(99),
    };
  }

  /**
   * Limpia todas las métricas
   */
  clear() {
    this.metrics = [];
    this.timings.clear();
  }

  /**
   * Obtiene resumen de métricas para logging/monitoring
   */
  getSummary(): string {
    const summary = {
      totalMetrics: this.metrics.length,
      activeTimings: this.timings.size,
      metricsByType: {} as Record<string, number>,
    };

    for (const metric of this.metrics) {
      summary.metricsByType[metric.type] =
        (summary.metricsByType[metric.type] || 0) + 1;
    }

    return JSON.stringify(summary, null, 2);
  }
}

// Instancia Singleton
export const metrics = new MetricsService();

// Ayudantes de métricas específicas de negocio
export const ticketMetrics = {
  /**
   * Registra creación de ticket
   */
  trackTicketCreated(priority: string) {
    metrics.incrementCounter("tickets_created_total", 1, { priority });
  },

  /**
   * Registra tiempo de primera respuesta
   */
  trackFirstResponseTime(durationMs: number) {
    metrics.recordHistogram("ticket_first_response_time_ms", durationMs);
  },

  /**
   * Registra tiempo total de resolución
   */
  trackResolutionTime(durationMs: number, priority: string) {
    metrics.recordHistogram("ticket_resolution_time_ms", durationMs, {
      priority,
    });
  },

  /**
   * Registra cambio de estado
   */
  trackStatusChange(fromStatus: string, toStatus: string) {
    metrics.incrementCounter("ticket_status_changes_total", 1, {
      from: fromStatus,
      to: toStatus,
    });
  },
};

export const assistantMetrics = {
  /**
   * Registra tiempo de respuesta de LAU
   */
  trackResponseTime(durationMs: number, ticketId: string) {
    metrics.recordHistogram("assistant_response_time_ms", durationMs);
    logger.info(
      `[LAU Metrics] Response time: ${durationMs}ms for ticket ${ticketId}`,
    );
  },

  /**
   * Registra detección de sentimiento
   */
  trackSentimentDetection(sentiment: string) {
    metrics.incrementCounter("assistant_sentiment_detected_total", 1, {
      sentiment,
    });
  },

  /**
   * Registra escalamiento automático
   */
  trackAutoEscalation(reason: string) {
    metrics.incrementCounter("assistant_auto_escalations_total", 1, { reason });
  },
};

export const emailMetrics = {
  /**
   * Registra envío de email
   */
  trackEmailSent(success: boolean, type: string) {
    metrics.incrementCounter("emails_sent_total", 1, {
      success: success.toString(),
      type,
    });
  },

  /**
   * Registra retry de email
   */
  trackEmailRetry(attempt: number) {
    metrics.incrementCounter("email_retries_total", 1, {
      attempt: attempt.toString(),
    });
  },
};
