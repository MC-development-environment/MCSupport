import { SystemConfig } from "@prisma/client";
import { setHours, setMinutes, getDay, addDays } from "date-fns";

/**
 * Calcula la fecha objetivo de SLA basada en horas laborales.
 * @param startDate La fecha/hora de inicio (usualmente ahora)
 * @param slaHours Número de horas para el SLA
 * @param config Configuración del sistema (horas laborales, días laborales)
 * @returns La fecha límite calculada
 */
export function calculateSlaTarget(
  startDate: Date,
  slaHours: number,
  config: Pick<
    SystemConfig,
    "businessHoursStart" | "businessHoursEnd" | "workDays" | "timeZone"
  >
): Date {
  let remainingHours = slaHours;
  let currentDate = new Date(startDate); // Trabajar con una copia

  // Asegurar que empezamos dentro de una ventana laboral válida
  // Si inicio es después de horas, mover al inicio del siguiente día
  // Si inicio es antes de horas, mover al inicio de hoy
  // Si inicio es en día no laboral, mover al inicio del siguiente día laboral
  currentDate = adjustToValidBusinessTime(currentDate, config);

  while (remainingHours > 0) {
    const businessEnd = getBusinessEndTime(currentDate, config);

    // Calcular horas disponibles hoy desde hora actual (o inicio) hasta fin del día
    // Diferencia en milisegundos / 1000 / 60 / 60
    const msUntilClose = businessEnd.getTime() - currentDate.getTime();
    const hoursUntilClose = msUntilClose / (1000 * 60 * 60);

    if (hoursUntilClose >= remainingHours) {
      // Puede terminar hoy
      return new Date(currentDate.getTime() + remainingHours * 60 * 60 * 1000);
    } else {
      // No puede terminar hoy, consumir todas las horas hoy y mover al siguiente día
      remainingHours -= hoursUntilClose;
      // Mover al inicio del siguiente día laboral
      currentDate = getNextBusinessDayStart(currentDate, config);
    }
  }

  return currentDate;
}

function adjustToValidBusinessTime(
  date: Date,
  config: Pick<
    SystemConfig,
    "businessHoursStart" | "businessHoursEnd" | "workDays"
  >
): Date {
  let d = new Date(date);

  // 1. Verificar si hoy es día laboral
  if (!isWorkDay(d, config.workDays)) {
    d = getNextBusinessDayStart(d, config);
  }

  // 2. Verificar límites de tiempo
  const startHour = config.businessHoursStart;
  const endHour = config.businessHoursEnd;

  const currentHour = d.getHours();

  if (currentHour >= endHour) {
    // ¿Después de horas? Mover al inicio del día siguiente
    d = getNextBusinessDayStart(d, config);
  } else if (currentHour < startHour) {
    // ¿Antes de horas? Mover al tiempo de inicio de hoy
    d = setMinutes(setHours(d, startHour), 0);
  }

  return d;
}

function getBusinessEndTime(
  date: Date,
  config: Pick<SystemConfig, "businessHoursEnd">
): Date {
  // Establecer a hora de fin : 00 minutos
  const d = new Date(date);
  d.setHours(config.businessHoursEnd, 0, 0, 0);
  return d;
}

function getNextBusinessDayStart(
  date: Date,
  config: Pick<SystemConfig, "businessHoursStart" | "workDays">
): Date {
  let d = addDays(date, 1);

  // Encontrar siguiente día laboral
  while (!isWorkDay(d, config.workDays)) {
    d = addDays(d, 1);
  }

  // Establecer a hora de inicio
  d.setHours(config.businessHoursStart, 0, 0, 0);
  return d;
}

function isWorkDay(date: Date, workDays: string[]): boolean {
  const day = getDay(date); // 0 = Domingo, 1 = Lunes, ...
  return workDays.includes(day.toString());
}
