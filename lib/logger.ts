import winston from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, json, printf, colorize } = winston.format;

// Formato personalizado para consola de desarrollo
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message} `;
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: "logs/application-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "14d", // Mantener logs por 14 días
  maxSize: "20m",
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(
    timestamp(),
    json() // Por defecto JSON para análisis en producción
  ),
  transports: [fileRotateTransport],
});

// Si no estamos en producción, registrar en `console` con formato simple
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    })
  );
} else {
  // En producción, también registrar en consola (stdout) para recolección de contenedores (ej. Docker/Sematext)
  logger.add(new winston.transports.Console());
}

export { logger };
