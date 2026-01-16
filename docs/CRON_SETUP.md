# Guía de Configuración: Tareas Programadas (Crons) 🕒

El sistema utiliza **Cron Jobs** para automatizar el mantenimiento, alertas y reportes. Estos endpoints son invocados periódicamente por un servicio externo (GitHub Actions o EasyCron).

## 📊 Resumen de Tareas

| Nombre                         | Endpoint                            | Frecuencia  | Descripción                                                                                                   |
| :----------------------------- | :---------------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------ |
| **Auto-Followup Cliente**      | `/api/cron/followup`                | Cada hora   | Notifica a clientes que no responden tickets en espera. Cierra automáticamente si se ignora por mucho tiempo. |
| **Alerta Inactividad Técnico** | `/api/cron/collaborator-inactivity` | Cada hora   | Notifica a los agentes si han dejado un ticket activo "abandonado" por más de 48h.                            |
| **Reportes Automatizados**     | `/api/cron/automated-reports`       | Cada hora\* | Genera reportes de rendimiento (Diarios, Semanales) según configuración en Admin.                             |

_\*Nota: Aunque se ejecuta cada hora, la lógica interna valida si corresponde enviar el reporte (ej. si son las 9:00 AM)._

---

## 🚀 Configuración (Paso a Paso)

Para que esto funcione, necesitas configurar **Variables de Entorno** y un **Disparador (Trigger)**.

### 1. Variables de Entorno (Producción)

En tu plataforma de hostin (Railway, Vercel, etc), asegúrate de tener definid:

- `CRON_SECRET`: Una cadena de texto larga y segura. Servirá de contraseña para que nadie más pueda ejecutar tus crons.

```bash
# Ejemplo de generación
openssl rand -base64 32
```

### 2. Configuración del Disparador (GitHub Actions)

Usamos GitHub Actions como "reloj" gratuito para llamar a estos endpoints.

1.  Ve a tu repositorio en **GitHub**.
2.  Navega a **Settings** → **Secrets and variables** → **Actions**.
3.  Crea los siguientes **Repository secrets**:

| Nombre        | Valor                                       | Ejemplo                         |
| :------------ | :------------------------------------------ | :------------------------------ |
| `APP_URL`     | La URL base de tu aplicación en producción. | `https://soporte.miempresa.com` |
| `CRON_SECRET` | El mismo valor que definiste en el paso 1.  | `Kj8...`                        |

### 3. Verificar Funcionamiento

1.  Ve a la pestaña **Actions** en GitHub.
2.  Busca el workflow **"Ticket Auto-Followup Cron"** (este archivo gestiona todas las llamadas).
3.  Puedes ejecutarlo manualmente con **Run workflow**.
4.  Si es exitoso, verás un check verde ✅.

---

## 🛠️ Detalles Técnicos

### Seguridad

Todos los endpoints validan que el parámetro `?secret=...` coincida con la variable de entorno `CRON_SECRET`. Si no coinciden, retornan `401 Unauthorized`.

### Lógica de Reportes

El cron de reportes (`automated-reports`) consulta la configuración global del sistema (`SystemConfig`).

- Si `automatedReportsEnabled` es `false`, se omite.
- Verifica si la hora actual coincide con la hora objetivo (9 AM) y si el día actual coincide con la frecuencia elegida (ej. Lunes para reportes semanales).
