# Guía de Configuración: Cron de Auto-Seguimiento (Railway + GitHub)

Esta guía explica cómo configurar el sistema para que LAU revise automáticamente los tickets cada hora, envíe recordatorios y cierre tickets inactivos.

## 1. Configuración en Railway (Variables de Entorno)

1.  Ve a tu proyecto en **Railway**.
2.  Selecciona tu servicio (Next.js App).
3.  Ve a la pestaña **Variables**.
4.  Agrega una nueva variable (si no existe):
    - **Clave**: `CRON_SECRET`
    - **Valor**: Inventa una contraseña segura (ej: `LauAutoSecret_2024_Secure`)

> **Nota**: Copia este valor, lo necesitarás en el siguiente paso.

## 2. Configuración en GitHub (Secrets)

Para que GitHub Actions pueda "despertar" a tu app cada hora, necesita permiso y saber dónde está tu app.

1.  Ve a tu repositorio en **GitHub**.
2.  Ve a **Settings** (Configuración) → **Secrets and variables** → **Actions**.
3.  Haz click en **New repository secret** y agrega estas dos variables:

### Variable 1: URL de la App

- **Name**: `APP_URL`
- **Secret**: La URL pública de tu app en Railway (ej: `https://soporte-production.up.railway.app`)
  - _Sin barra al final_

### Variable 2: Secreto del Cron

- **Name**: `CRON_SECRET`
- **Secret**: El mismo valor que pusiste en Railway (ej: `LauAutoSecret_2024_Secure`)

## 3. Verificación

Una vez configurado:

1.  Ve a la pestaña **Actions** en GitHub.
2.  Verás un workflow llamado **"Ticket Auto-Followup Cron"**.
3.  Puedes probarlo manualmente:
    - Selecciona el workflow a la izquierda.
    - Click en **Run workflow**.
4.  Si todo está bien, verás un check verde ✅ y en los logs dirá "success".

---

## ¿Cómo funciona la Lógica?

- **Cada hora**, GitHub visita tu página `/api/cron/followup`.
- **LAU revisa** los tickets en estado `WAITING_CUSTOMER`:
  - **48 horas sin actualización**: Envía recordatorio amable.
  - **6 días sin actualización**: Envía advertencia final (si no ha enviado otra en las últimas 24h).
  - **7 días sin actualización**: Cierra el ticket automáticamente.
