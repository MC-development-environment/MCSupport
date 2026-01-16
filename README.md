# MCSupport - Portal de Soporte Multicomputos

MCSupport es una plataforma moderna de gestión de tickets y soporte técnico diseñada para Multicomputos S.R.L. Ofrece un panel administrativo robusto, internacionalización completa y capacidad de integración con ERPs como Netsuite.

## Características Principales

- **Panel Administrativo**: Dashboard con métricas, gestión de tickets y base de conocimiento.
- **Internacionalización (i18n)**: Soporte completo para Inglés (`/en`) y Español (`/es`).
- **Diseño Responsivo**: Interfaz optimizada para móviles y escritorio con Branding corporativo.
- **Gestión de Configuración Global**: Control de parámetros del sistema (horarios, correos) desde UI.
- **Filtrado Avanzado**: Búsqueda detallada de tickets y asignación jerárquica.
- **Asistente Virtual (LAU)**: IA con respuestas contextuales y análisis de sentimiento.
- **Automatización de Tickets**: Cierre automático tras 24h de resolución y envío de encuestas de satisfacción.
- **Comunicación Mejorada**: Soporte para copias (CC) en tickets y notas internas para agentes.
- **Seguridad Avanzada**: Autenticación de dos factores (2FA) con códigos de respaldo.
- **Integración API**: Endpoint seguro para recibir tickets desde sistemas externos (Netsuite).
- **Gestión de Archivos**: Carga robusta de adjuntos (hasta 20MB) con validación.
- **Monitoreo y Rendimiento**: Integración con Sentry, SEO optimizado y despliegue Dockerizado.
- **PWA**: Instalable como aplicación web progresiva.
- **Modo Oscuro**: Soporte nativo para temas claro y oscuro.
- **Modo Vacaciones**: Gestión de ausencias para agentes con reasignación y respuestas automáticas.

## Tareas Programadas (Crons) 🕒

El sistema incluye procesos automáticos vitales que requieren configuración:

1.  **Auto-Seguimiento**: Cierre automático de tickets abandonados por clientes.
2.  **Alerta de Inactividad**: Notificación a técnicos sobre tickets estancados.
3.  **Reportes Automatizados**: Envío periódico de estadísticas por correo.

👉 **[Ver Guía de Configuración de Crons](docs/CRON_SETUP.md)** para activarlos.

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL / Prisma ORM
- **Estilos**: Tailwind CSS + Shadcn/UI
- **Autenticación**: Auth.js (NextAuth v5)
- **Internacionalización**: next-intl

## Configuración Local

1.  **Clonar el repositorio**:

    ```bash
    git clone <repo-url>
    cd mc_support
    ```

2.  **Instalar dependencias**:

    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Crear un archivo `.env` en la raíz basado en `.env.example`:

    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/mc_support"
    AUTH_SECRET="your-secret-key"
    NETSUITE_API_KEY="ns-secret-123"
    ```

4.  **Inicializar Base de Datos**:

    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```

    _Esto creará un usuario administrador por defecto: `admin@multicomputos.com` / `admin123`_

5.  **Correr Servidor de Desarrollo**:
6.  **Correr Tests**:

    ```bash
    # Tests Unitarios
    npm run test

    # Tests E2E (Playwright)
    npm run test:e2e
    npm run test:e2e:ui # Con interfaz visual
    ```

## Estructura del Proyecto

- `app/[locale]/(admin)`: Rutas protegidas del panel administrativo.
- `app/[locale]/(portal)`: Portal de autoservicio para clientes.
- `app/api/integration`: Endpoints para integraciones externas.
- `components`: Componentes reutilizables UI y de negocio.
- `messages`: Archivos de traducción JSON.
- `prisma`: Esquema de base de datos y scripts de semilla.

## Documentación

La documentación se encuentra organizada en la carpeta `docs/`:

- 📘 **[Manual de Cliente](docs/Manual_Cliente.md)**: Guía para clientes del portal de autoservicio.
- 📕 **[Manual Operativo](docs/Manual_Operativo.md)**: Guía para agentes y administradores del sistema.
- 🛠️ **[Guía Técnica](docs/Guia_Tecnica.md)**: Detalles de arquitectura, base de datos y despliegue.
- 🔌 **[Integración NetSuite](docs/NETSUITE_INTEGRATION.md)**: Guía de configuración y uso de webhooks.
- 🔐 **[Variables de Entorno](docs/ENV_VARS.md)**: Diccionario completo de configuración.
- ☁️ **[Configuración Cloudinary](docs/CLOUDINARY_SETUP.md)**: Guía para gestión de archivos.
- 🕒 **[Configuración Cron](docs/CRON_SETUP.md)**: Tareas programadas.
- 🛡️ **[Configuración Sentry](docs/SENTRY_SETUP.md)**: Monitoreo de errores.

## Contribuir

Si deseas contribuir al proyecto, por favor lee nuestra [Guía de Contribución](CONTRIBUTING.md).

---

© 2025 Multicomputos S.R.L. - Todos los derechos reservados.
