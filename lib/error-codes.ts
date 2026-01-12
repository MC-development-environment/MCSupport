/**
 * Códigos de error centralizados para traducción en cliente.
 * Estos códigos se envían desde las acciones del servidor
 * y se traducen en el cliente usando next-intl.
 *
 * Uso en servidor:
 *   return { success: false, error: ErrorCodes.UNAUTHORIZED };
 *
 * Uso en cliente:
 *   const message = translateError(error, t);
 */

export const ErrorCodes = {
  // Autenticación y autorización
  UNAUTHORIZED: "ERROR_UNAUTHORIZED",
  SESSION_EXPIRED: "ERROR_SESSION_EXPIRED",
  PERMISSION_DENIED: "ERROR_PERMISSION_DENIED",

  // Datos y validación
  NOT_FOUND: "ERROR_NOT_FOUND",
  TICKET_NOT_FOUND: "ERROR_TICKET_NOT_FOUND",
  USER_NOT_FOUND: "ERROR_USER_NOT_FOUND",
  INVALID_DATA: "ERROR_INVALID_DATA",
  INVALID_STATUS: "ERROR_INVALID_STATUS",
  INVALID_PRIORITY: "ERROR_INVALID_PRIORITY",
  INVALID_CODE: "ERROR_INVALID_CODE",
  CONTENT_EMPTY: "ERROR_CONTENT_EMPTY",

  // Estado
  TICKET_NOT_CLOSED: "ERROR_TICKET_NOT_CLOSED",
  ALREADY_COMPLETED: "ERROR_ALREADY_COMPLETED",

  // Usuarios y autenticación
  EMAIL_EXISTS: "ERROR_EMAIL_EXISTS",
  PASSWORD_REQUIRED: "ERROR_PASSWORD_REQUIRED",
  PASSWORD_INCORRECT: "ERROR_PASSWORD_INCORRECT",
  LOGIN_REQUIRED: "ERROR_LOGIN_REQUIRED",

  // 2FA
  TWO_FA_ALREADY_ENABLED: "ERROR_2FA_ALREADY_ENABLED",
  TWO_FA_NOT_ENABLED: "ERROR_2FA_NOT_ENABLED",
  TWO_FA_SECRET_REQUIRED: "ERROR_2FA_SECRET_REQUIRED",
  TWO_FA_NO_PASSWORD: "ERROR_2FA_NO_PASSWORD",

  // Archivos
  FILE_LIMIT_REACHED: "ERROR_FILE_LIMIT",
  FILE_SIZE_EXCEEDED: "ERROR_FILE_SIZE",

  // Permisos específicos
  NO_CATEGORY_PERMISSION: "ERROR_NO_CATEGORY_PERMISSION",
  NO_REOPEN_PERMISSION: "ERROR_NO_REOPEN_PERMISSION",
  NO_PRIORITY_PERMISSION: "ERROR_NO_PRIORITY_PERMISSION",
  NO_CLOSE_PERMISSION: "ERROR_NO_CLOSE_PERMISSION",
  NO_INTERNAL_NOTES: "ERROR_NO_INTERNAL_NOTES",

  // Reportes
  TECHNICAL_ONLY: "ERROR_TECHNICAL_ONLY",

  // Errores genéricos de operación
  UPDATE_STATUS_FAILED: "ERROR_UPDATE_STATUS_FAILED",
  ASSIGN_FAILED: "ERROR_ASSIGN_FAILED",
  SEND_MESSAGE_FAILED: "ERROR_SEND_MESSAGE_FAILED",
  UPDATE_CATEGORY_FAILED: "ERROR_UPDATE_CATEGORY_FAILED",
  REOPEN_FAILED: "ERROR_REOPEN_FAILED",
  UPDATE_PRIORITY_FAILED: "ERROR_UPDATE_PRIORITY_FAILED",
  CLOSE_TICKET_FAILED: "ERROR_CLOSE_TICKET_FAILED",
  SAVE_SURVEY_FAILED: "ERROR_SAVE_SURVEY_FAILED",
  GET_DEPARTMENTS_FAILED: "ERROR_GET_DEPARTMENTS_FAILED",

  // Vacaciones
  USER_ON_VACATION: "ERROR_USER_ON_VACATION",
  INVALID_DATE_RANGE: "ERROR_INVALID_DATE_RANGE",
  NO_REASSIGNMENT_TARGET: "ERROR_NO_REASSIGNMENT_TARGET",
  ACTION_BLOCKED_VACATION: "ERROR_ACTION_BLOCKED_VACATION",
  INTERNAL_ERROR: "ERROR_INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Verifica si un string es un código de error conocido.
 */
export function isErrorCode(value: string): value is ErrorCode {
  return Object.values(ErrorCodes).includes(value as ErrorCode);
}

/**
 * Mapeo de códigos de error a claves de traducción i18n.
 * Las claves corresponden a Common.errors.[key]
 */
const errorCodeToI18nKey: Record<ErrorCode, string> = {
  [ErrorCodes.UNAUTHORIZED]: "unauthorized",
  [ErrorCodes.SESSION_EXPIRED]: "sessionExpired",
  [ErrorCodes.PERMISSION_DENIED]: "permissionDenied",
  [ErrorCodes.NOT_FOUND]: "notFound",
  [ErrorCodes.TICKET_NOT_FOUND]: "ticketNotFound",
  [ErrorCodes.USER_NOT_FOUND]: "userNotFound",
  [ErrorCodes.INVALID_DATA]: "invalidData",
  [ErrorCodes.INVALID_STATUS]: "invalidStatus",
  [ErrorCodes.INVALID_PRIORITY]: "invalidPriority",
  [ErrorCodes.INVALID_CODE]: "invalidCode",
  [ErrorCodes.CONTENT_EMPTY]: "contentEmpty",
  [ErrorCodes.TICKET_NOT_CLOSED]: "ticketNotClosed",
  [ErrorCodes.ALREADY_COMPLETED]: "alreadyCompleted",
  [ErrorCodes.EMAIL_EXISTS]: "emailExists",
  [ErrorCodes.PASSWORD_REQUIRED]: "passwordRequired",
  [ErrorCodes.PASSWORD_INCORRECT]: "passwordIncorrect",
  [ErrorCodes.LOGIN_REQUIRED]: "loginRequired",
  [ErrorCodes.TWO_FA_ALREADY_ENABLED]: "twoFaAlreadyEnabled",
  [ErrorCodes.TWO_FA_NOT_ENABLED]: "twoFaNotEnabled",
  [ErrorCodes.TWO_FA_SECRET_REQUIRED]: "twoFaSecretRequired",
  [ErrorCodes.TWO_FA_NO_PASSWORD]: "twoFaNoPassword",
  [ErrorCodes.FILE_LIMIT_REACHED]: "fileLimit",
  [ErrorCodes.FILE_SIZE_EXCEEDED]: "fileSize",
  [ErrorCodes.NO_CATEGORY_PERMISSION]: "noCategoryPermission",
  [ErrorCodes.NO_REOPEN_PERMISSION]: "noReopenPermission",
  [ErrorCodes.NO_PRIORITY_PERMISSION]: "noPriorityPermission",
  [ErrorCodes.NO_CLOSE_PERMISSION]: "noClosePermission",
  [ErrorCodes.NO_INTERNAL_NOTES]: "noInternalNotes",
  [ErrorCodes.TECHNICAL_ONLY]: "technicalOnly",
  [ErrorCodes.UPDATE_STATUS_FAILED]: "updateStatusFailed",
  [ErrorCodes.ASSIGN_FAILED]: "assignFailed",
  [ErrorCodes.SEND_MESSAGE_FAILED]: "sendMessageFailed",
  [ErrorCodes.UPDATE_CATEGORY_FAILED]: "updateCategoryFailed",
  [ErrorCodes.REOPEN_FAILED]: "reopenFailed",
  [ErrorCodes.UPDATE_PRIORITY_FAILED]: "updatePriorityFailed",
  [ErrorCodes.CLOSE_TICKET_FAILED]: "closeTicketFailed",
  [ErrorCodes.SAVE_SURVEY_FAILED]: "saveSurveyFailed",
  [ErrorCodes.GET_DEPARTMENTS_FAILED]: "getDepartmentsFailed",
  [ErrorCodes.USER_ON_VACATION]: "userOnVacation",
  [ErrorCodes.INVALID_DATE_RANGE]: "invalidDateRange",
  [ErrorCodes.NO_REASSIGNMENT_TARGET]: "noReassignmentTarget",
  [ErrorCodes.ACTION_BLOCKED_VACATION]: "actionBlockedVacation",
  [ErrorCodes.INTERNAL_ERROR]: "internalError",
};

/**
 * Traduce un código de error usando la función t de next-intl.
 * Uso: translateError(error, t) donde t = useTranslations("Common")
 *
 * @param error - El error recibido (puede ser string, Error, o respuesta con .error)
 * @param t - Función de traducción de useTranslations("Common")
 * @param fallback - Mensaje fallback si no se encuentra traducción
 */
export function translateError(
  error: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string) => string,
  fallback?: string
): string {
  let errorCode: string;

  if (typeof error === "string") {
    errorCode = error;
  } else if (error instanceof Error) {
    errorCode = error.message;
  } else if (error && typeof error === "object" && "error" in error) {
    errorCode = String((error as { error: unknown }).error);
  } else {
    return fallback || t("error");
  }

  // Si es un código de error conocido, traducirlo
  if (isErrorCode(errorCode)) {
    const i18nKey = errorCodeToI18nKey[errorCode];
    try {
      return t(`errors.${i18nKey}`);
    } catch {
      return fallback || t("error");
    }
  }

  // Si no es un código conocido, devolver el mensaje original o fallback
  return errorCode || fallback || t("error");
}
