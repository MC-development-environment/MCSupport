# Guía de Configuración: Almacenamiento en Cloudinary ☁️

Cloudinary es un servicio para guardar y optimizar imágenes en la nube. Es esencial para que los archivos subidos no se pierdan al desplegar en Railway.

## 1. Crear Cuenta y Obtener Credenciales

1.  Regístrate gratis en [cloudinary.com](https://cloudinary.com/).
2.  Al entrar al Dashboard (Panel Principal), verás el recuadro **"Product Environment Credentials"**.
3.  Necesitas copiar estos 3 valores:
    - **Cloud Name**
    - **API Key**
    - **API Secret**

## 2. Configuración en Railway (Variables de Entorno)

1.  Ve a tu proyecto en **Railway**.
2.  Pestaña **Variables**.
3.  Agrega las siguientes variables:

| Variable                | Descripción                 | Ejemplo  |
| :---------------------- | :-------------------------- | :------- |
| `CLOUDINARY_CLOUD_NAME` | El nombre de tu nube        | `dq9...` |
| `CLOUDINARY_API_KEY`    | Tu clave de API             | `849...` |
| `CLOUDINARY_API_SECRET` | Tu secreto (¡No compartir!) | `ABC...` |

> **Nota**: También debes agregarlas en tu archivo `.env` local para que funcione en desarrollo.

## 3. Verificación

Sube una imagen al crear un ticket. Si todo está bien:

1.  La imagen debería verse correctamente en el ticket.
2.  Si inspeccionas la imagen (Click derecho -> Abrir en nueva pestaña), la URL debería empezar con `https://res.cloudinary.com/...`.
