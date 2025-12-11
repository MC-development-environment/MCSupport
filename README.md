# MCSupport - Portal de Soporte Multicomputos

MCSupport es una plataforma moderna de gestión de tickets y soporte técnico diseñada para Multicomputos S.R.L. Ofrece un panel administrativo robusto, internacionalización completa y capacidad de integración con ERPs como Netsuite.

## Características Principales

*   **Panel Administrativo**: Dashboard con métricas, gestión de tickets y base de conocimiento.
*   **Internacionalización (i18n)**: Soporte completo para Inglés (`/en`) y Español (`/es`).
*   **Diseño Responsivo**: Interfaz optimizada para móviles y escritorio con Branding corporativo.
*   **Integración API**: Endpoint seguro para recibir tickets desde sistemas externos (Netsuite).
*   **PWA**: Instalable como aplicación web progresiva.
*   **Modo Oscuro**: Soporte nativo para temas claro y oscuro.

## Stack Tecnológico

*   **Framework**: Next.js 16 (App Router)
*   **Lenguaje**: TypeScript
*   **Base de Datos**: PostgreSQL / Prisma ORM
*   **Estilos**: Tailwind CSS + Shadcn/UI
*   **Autenticación**: Auth.js (NextAuth v5)
*   **Internacionalización**: next-intl

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
    *Esto creará un usuario administrador por defecto: `admin@multicomputos.com` / `admin123`*

5.  **Correr Servidor de Desarrollo**:
    ```bash
    npm run dev
    ```
    Acceder a `http://localhost:3000`.

## Estructura del Proyecto

*   `app/[locale]/(admin)`: Rutas protegidas del panel administrativo.
*   `app/[locale]/(portal)`: Portal de autoservicio para clientes.
*   `app/api/integration`: Endpoints para integraciones externas.
*   `components`: Componentes reutilizables UI y de negocio.
*   `messages`: Archivos de traducción JSON.
*   `prisma`: Esquema de base de datos y scripts de semilla.

## Documentación

El proyecto cuenta con documentación detallada para diferentes perfiles:

*   📘 **[Manual de Usuario](doc/Manual_Usuario.md)**: Guía paso a paso con capturas de pantalla sobre cómo utilizar el sistema, gestionar tickets y ver reportes.
*   🛠️ **[Guía Técnica](doc/Guia_Tecnica.md)**: Documentación profunda para desarrolladores sobre arquitectura, base de datos, seguridad y despliegue.

## Contribuir

Si deseas contribuir al proyecto, por favor lee nuestra [Guía de Contribución](CONTRIBUTING.md).

---
© 2025 Multicomputos S.R.L. - Todos los derechos reservados.
