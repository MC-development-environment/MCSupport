# Diccionario de Variables de Entorno 🔑

Esta es la lista maestra de todas las variables necesarias para que la aplicación funcione correctamente en Producción (Railway).

## Base de Datos (Prisma)

| Variable       | Descripción                                                                          |
| :------------- | :----------------------------------------------------------------------------------- |
| `DATABASE_URL` | String de conexión a **PostgreSQL** (Proporcionado por Railway o tu proveedor de BD) |

## Autenticación (Auth.js)

| Variable              | Descripción                                                                                          |
| :-------------------- | :--------------------------------------------------------------------------------------------------- |
| `AUTH_SECRET`         | Clave aleatoria para firmar tokens. Generar con `openssl rand -base64 32`                            |
| `AUTH_URL`            | La URL de tu sitio (ej: `https://soporte.up.railway.app`). En Vercel no es necesario, en Railway SÍ. |
| `AUTH_TRUST_HOST`     | Ponlo en `true` para confiar en el proxy de Railway.                                                 |
| `NEXT_PUBLIC_APP_URL` | Igual a `AUTH_URL`. Útil para el cliente (frontend) y redirecciones.                                 |

## Email (SMTP)

Configuración para enviar correos (Gmail, Outlook, Resend, etc.)

| Variable      | Descripción                                                |
| :------------ | :--------------------------------------------------------- |
| `SMTP_HOST`   | Servidor SMTP (ej: `smtp.gmail.com`)                       |
| `SMTP_PORT`   | Puerto (ej: `587` o `465`)                                 |
| `SMTP_USER`   | Tu correo electrónico                                      |
| `SMTP_PASS`   | Contraseña de aplicación (App Password)                    |
| `SMTP_SECURE` | `true` si usas puerto 465, `false` si no.                  |
| `SMTP_FROM`   | Email remitente (ej: `"Soporte" <no-reply@tuempresa.com>`) |

## Almacenamiento (Cloudinary)

Ver [CLOUDINARY_SETUP.md](./CLOUDINARY_SETUP.md)

| Variable                | Descripción       |
| :---------------------- | :---------------- |
| `CLOUDINARY_CLOUD_NAME` | Nombre de la nube |
| `CLOUDINARY_API_KEY`    | API Key           |
| `CLOUDINARY_API_SECRET` | API Secret        |

## Cron Jobs

Ver [CRON_SETUP.md](./CRON_SETUP.md)

| Variable      | Descripción                                            |
| :------------ | :----------------------------------------------------- |
| `CRON_SECRET` | Contraseña inventada para proteger el endpoint de cron |

## Monitoreo (Sentry)

Ver [SENTRY_SETUP.md](./SENTRY_SETUP.md)

| Variable            | Descripción                             |
| :------------------ | :-------------------------------------- |
| `SENTRY_AUTH_TOKEN` | Token para subir sourcemaps en el build |

## Integraciones y Otros

| Variable           | Descripción                                                                                                  |
| :----------------- | :----------------------------------------------------------------------------------------------------------- |
| `NETSUITE_API_KEY` | Clave secreta para recibir webhooks desde NetSuite. Ver [NETSUITE_INTEGRATION.md](./NETSUITE_INTEGRATION.md) |
| `LOG_LEVEL`        | Nivel de detalle de logs: `info`, `warn`, `error` o `debug`. Default: `info`                                 |
