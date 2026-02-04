import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { hash, compare } from "bcryptjs";

export class TwoFactorService {
  /**
   * Genera un nuevo secreto TOTP para un usuario
   */
  static generateSecret(email: string) {
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `MC Support (${email})`,
      issuer: "MC Support",
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || "",
    };
  }

  /**
   * Genera una URL de Datos QR desde la URL otpauth
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    if (!otpauthUrl) return "";
    return await QRCode.toDataURL(otpauthUrl);
  }

  /**
   * Verifica un token TOTP contra un secreto
   * Ventana: 2 pasos (permite desviación de +/- 60 segundos)
   */
  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2,
    });
  }

  /**
   * Genera códigos de recuperación (8 códigos de 8 caracteres XX-XX-XX-XX)
   */
  static async generateBackupCodes(
    count: number = 8
  ): Promise<{ codes: string[]; hashed: string[] }> {
    const codes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const buffer = speakeasy.generateSecret({ length: 5 });
      const code = buffer.base32.slice(0, 8).toUpperCase();
      const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;

      codes.push(formatted);
      const hashed = await hash(formatted, 10);
      hashedCodes.push(hashed);
    }

    return { codes, hashed: hashedCodes };
  }

  /**
   * Verifica un código de respaldo contra códigos almacenados hasheados
   * Retorna índice del código usado para permitir eliminación
   */
  static async verifyBackupCode(
    code: string,
    hashedCodes: string[]
  ): Promise<{ valid: boolean; usedIndex?: number }> {
    const cleanCode = code.trim().toUpperCase();

    for (let i = 0; i < hashedCodes.length; i++) {
      const isValid = await compare(cleanCode, hashedCodes[i]);
      if (isValid) {
        return { valid: true, usedIndex: i };
      }
    }
    return { valid: false };
  }
}
