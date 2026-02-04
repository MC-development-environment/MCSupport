/**
 * Servicio de validación de archivos
 *
 * Valida archivos subidos verificando:
 * - Extensión de archivo contra lista blanca
 * - Verificación de tipo MIME usando bytes mágicos
 * - Límites de tamaño de archivo
 */

// Tipos de archivo permitidos con sus firmas de bytes mágicos
const FILE_SIGNATURES: Record<
  string,
  { mimeTypes: string[]; magicBytes: number[][] }
> = {
  // Images
  jpg: {
    mimeTypes: ["image/jpeg"],
    magicBytes: [[0xff, 0xd8, 0xff]],
  },
  jpeg: {
    mimeTypes: ["image/jpeg"],
    magicBytes: [[0xff, 0xd8, 0xff]],
  },
  png: {
    mimeTypes: ["image/png"],
    magicBytes: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  },
  gif: {
    mimeTypes: ["image/gif"],
    magicBytes: [[0x47, 0x49, 0x46, 0x38]],
  },
  webp: {
    mimeTypes: ["image/webp"],
    magicBytes: [[0x52, 0x49, 0x46, 0x46]], // Encabezado RIFF
  },

  // Documents
  pdf: {
    mimeTypes: ["application/pdf"],
    magicBytes: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  },
  doc: {
    mimeTypes: ["application/msword"],
    magicBytes: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  },
  docx: {
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    magicBytes: [[0x50, 0x4b, 0x03, 0x04]], // Encabezado ZIP (DOCX es un ZIP)
  },
  xlsx: {
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    magicBytes: [[0x50, 0x4b, 0x03, 0x04]], // Encabezado ZIP
  },

  // Text
  txt: {
    mimeTypes: ["text/plain"],
    magicBytes: [], // Sin firma específica para archivos de texto
  },
  csv: {
    mimeTypes: ["text/csv"],
    magicBytes: [],
  },
};

// Extensiones permitidas por defecto (de SystemConfig)
const DEFAULT_ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
  ".xlsx",
  ".txt",
  ".csv",
];

// Límites de tamaño
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_TOTAL_SIZE = 20 * 1024 * 1024; // 20MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings: string[];
}

export interface FileValidationOptions {
  allowedExtensions?: string[];
  maxFileSize?: number;
  maxTotalSize?: number;
  checkMagicBytes?: boolean;
}

/**
 * Obtener extensión de archivo del nombre
 */
function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * Verificar si la extensión del archivo está permitida
 */
export function isExtensionAllowed(
  filename: string,
  allowedExtensions: string[] = DEFAULT_ALLOWED_EXTENSIONS
): boolean {
  const ext = "." + getExtension(filename);
  return allowedExtensions.some(
    (allowed) => allowed.toLowerCase() === ext.toLowerCase()
  );
}

/**
 * Validar bytes mágicos del archivo para prevenir suplantación MIME
 * Retorna true si el contenido real del archivo coincide con el tipo esperado
 */
export async function validateMagicBytes(
  file: File | ArrayBuffer,
  expectedExtension: string
): Promise<{ valid: boolean; detectedType?: string }> {
  const ext = expectedExtension.replace(".", "").toLowerCase();
  const signature = FILE_SIGNATURES[ext];

  // Saltar validación para tipos de archivo sin firmas
  if (!signature || signature.magicBytes.length === 0) {
    return { valid: true };
  }

  // Obtener primeros bytes del archivo
  let buffer: ArrayBuffer;
  if (file instanceof File) {
    const blob = file.slice(0, 16); // Primeros 16 bytes es suficiente
    buffer = await blob.arrayBuffer();
  } else {
    buffer = file.slice(0, 16);
  }

  const bytes = new Uint8Array(buffer);

  // Verificar si alguna de las firmas esperadas coincide
  for (const expected of signature.magicBytes) {
    let matches = true;
    for (let i = 0; i < expected.length; i++) {
      if (bytes[i] !== expected[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return { valid: true, detectedType: ext };
    }
  }

  // Intentar detectar cuál es el tipo real
  const detectedType = detectFileType(bytes);

  return {
    valid: false,
    detectedType,
  };
}

/**
 * Detectar tipo de archivo desde bytes mágicos
 */
function detectFileType(bytes: Uint8Array): string | undefined {
  for (const [ext, signature] of Object.entries(FILE_SIGNATURES)) {
    for (const expected of signature.magicBytes) {
      let matches = true;
      for (let i = 0; i < expected.length && i < bytes.length; i++) {
        if (bytes[i] !== expected[i]) {
          matches = false;
          break;
        }
      }
      if (matches && expected.length > 0) {
        return ext;
      }
    }
  }
  return undefined;
}

/**
 * Validar un solo archivo
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    checkMagicBytes = true,
  } = options;

  const warnings: string[] = [];

  // Verificar tamaño de archivo
  if (file.size > maxFileSize) {
    const maxMB = Math.round(maxFileSize / 1024 / 1024);
    return {
      valid: false,
      error: `El archivo "${file.name}" excede el límite de ${maxMB}MB`,
      warnings,
    };
  }

  // Verificar extensión
  if (!isExtensionAllowed(file.name, allowedExtensions)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${getExtension(file.name)}`,
      warnings,
    };
  }

  // Validar bytes mágicos (protección contra suplantación MIME)
  if (checkMagicBytes) {
    const ext = getExtension(file.name);
    const magicResult = await validateMagicBytes(file, ext);

    if (!magicResult.valid) {
      const detected = magicResult.detectedType
        ? `Parece ser un archivo .${magicResult.detectedType}`
        : "Tipo de contenido no reconocido";

      return {
        valid: false,
        error: `El archivo "${file.name}" tiene contenido inválido. ${detected}`,
        warnings,
      };
    }
  }

  // Verificar nombres de archivo sospechosos
  if (/[<>:"|?*\\]/.test(file.name)) {
    warnings.push(`El nombre del archivo contiene caracteres especiales`);
  }

  return { valid: true, warnings };
}

/**
 * Validar múltiples archivos
 */
export async function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const { maxTotalSize = DEFAULT_MAX_TOTAL_SIZE, ...fileOptions } = options;

  const warnings: string[] = [];

  // Verificar tamaño total
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxTotalSize) {
    const maxMB = Math.round(maxTotalSize / 1024 / 1024);
    return {
      valid: false,
      error: `El tamaño total de archivos excede el límite de ${maxMB}MB`,
      warnings,
    };
  }

  // Validar cada archivo
  for (const file of files) {
    const result = await validateFile(file, fileOptions);
    if (!result.valid) {
      return result;
    }
    warnings.push(...result.warnings);
  }

  return { valid: true, warnings };
}

/**
 * Obtener lista de extensiones permitidas para visualización UI
 */
export function getAllowedExtensionsDisplay(
  extensions: string[] = DEFAULT_ALLOWED_EXTENSIONS
): string {
  return extensions.join(", ");
}

/**
 * Desinfectar nombre de archivo para prevenir ataques de path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Eliminar separadores de ruta y caracteres peligrosos
  return filename
    .replace(/[/\\]/g, "_") // Separadores de ruta
    .replace(/[<>:"|?*]/g, "_") // Caracteres reservados de Windows
    .replace(/\.\./g, "_") // Navegación a directorio padre
    .replace(/^\./, "_") // Archivos ocultos
    .trim();
}
