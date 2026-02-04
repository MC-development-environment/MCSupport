import { v2 as cloudinary } from "cloudinary";

// Configuración de Cloudinary
// Se toma de las variables de entorno
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Sube un archivo (Buffer) a Cloudinary
 * @param buffer Buffer del archivo
 * @param folder Carpeta en Cloudinary (opcional)
 * @returns Promesa con el resultado de la subida
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = process.env.CLOUDINARY_FOLDER || "mc_support_tickets"
): Promise<{ url: string; public_id: string; format: string }> {
  return new Promise((resolve, reject) => {
    // Para simplificar, enviamos como data URI genérico si no tenemos el mime exacto a mano aquí,
    // pero idealmente deberíamos pasarlo. Cloudinary suele ser inteligente.
    // Sin embargo, upload_stream es mejor para buffers.

    // Usaremos upload_stream que es más eficiente para buffers en el servidor
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto", // Detectar imagen, video, pdf, etc.
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
        });
      }
    );

    // Escribir el buffer en el stream
    uploadStream.end(buffer);
  });
}

export default cloudinary;
