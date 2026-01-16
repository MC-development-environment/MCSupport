# Guía Técnica Integral: Arquitectura y Desarrollo 🛠️

**Versión:** 3.0.0
**Fecha:** Enero 2026
**Proyecto:** MC Support System

Esta guía documenta la totalidad de la arquitectura técnica, decisiones de diseño, modelos de datos y procedimientos de operación de la plataforma.

---

## 1. Arquitectura del Sistema

### 1.1 Stack Tecnológico

La aplicación es un **Monolito Modular** construido sobre tecnologías modernas de Next.js.

- **Runtime**: Node.js 18+ (Alpine Linux en Docker).
- **Framework**: Next.js 16.0.7 (App Router).
- **Comunicación**: Server Actions (RPC). No existe API REST interna para el frontend.
- **Base de Datos**: PostgreSQL 15+ (Gestionado via Prisma ORM 5.22).
- **Cola de Tareas**: Cron Jobs HTTP (`/api/cron/*`) invocados externamente.
- **Estilos**: TailwindCSS 4.0 + Shadcn/UI (Radix Primitives).
- **Gráficos**: Recharts (Librería de visualización basada en D3).
  - _Nota_: Se incluye `react-is` como dependencia directa para compatibilidad con React 19.

### 1.2 Estructura de Directorios (Mapa del Código)

```text
/
├── actions/                  # SERVER ACTIONS (Write Operations)
│   ├── ticket-actions.ts     # CRUD Tickets, Cambios de Estado, Notas
│   ├── auth-actions.ts       # Login, Register, 2FA Logic
│   └── analytics-actions.ts  # 📊 Data aggregation for reports
├── app/                      # ROUTING LAYER
│   ├── (auth)/               # Login Pages (Public)
│   ├── (portal)/             # Client Area (Protected Role=CLIENT)
│   ├── (admin)/              # Agent Area (Protected Role!=CLIENT)
│   └── api/                  # Public Webhooks (NetSuite, Cron)
├── components/               # UI LIBRARY
│   ├── admin/                # Admin-specific components (Reports, Filters)
│   │   ├── reports-client.tsx # 📈 Analytics Dashboard Container
│   │   ├── settings-form.tsx # ⚙️ System Config Form
│   │   └── vacation-toggle.tsx # 🌴 Vacation Mode (Pattern: Controlled Popover)
│   ├── portal/               # Client-specific components
│   │   └── ticket-form.tsx   # 📝 Client Ticket Form forms logic
│   └── ui/                   # Shadcn Reusable Atoms
├── lib/                      # CORE LOGIC (Domain Layer)
│   ├── lau/                  # 🤖 LAU (Assistant) Module
│   │   ├── analyzer.ts       # Sentiment/Language Analysis
│   │   └── auto-assignment.ts# Routing Logic
│   ├── sla-service.ts        # ⏱️ SLA Calculation Engine
│   ├── rate-limiter.ts       # 🛡️ Security Limiter
│   ├── email-service.ts      # 📧 SMTP Wrapper
│   └── prisma.ts             # DB Singleton
└── prisma/
    └── schema.prisma         # Data Model Definition
```

---

## 2. Modelado de Datos (Deep Dive)

### 2.1 Diagrama Entidad-Relacion (Resumen)

El modelo gira en torno a la entidad `User` y `Case`.

- **User**: Centraliza Autenticación + Perfil.
  - `role`: Enum (MANAGER, TECHNICIAN, CLIENT...). Define RBAC.
  - `departmentId`: Para routing de tickets.
  - `twoFactorSecret`: Para 2FA (TOTP).
- **Case (Ticket)**:
  - `status`: Máquina de estados. `WAITING_CUSTOMER` **pausa** el cálculo de SLA.
  - `slaPausedAt`: Timestamp del inicio de la pausa.
  - `totalPausedMinutes`: Acumulador de tiempo pausado.
  - `priority`: Determina SLA.
  - `slaTargetAt`: Fecha calculada de vencimiento (ajustada por pausas).
- **Survey (Encuesta)**:
  - `rating`: 1-5.
  - `comment`: Comentario opcional.
  - `resolvedById`: Snapshop del agente resolutor (para integridad métrica).
  - `ticketId`: Relación 1:1 con Case.

### 2.2 Índices y Rendimiento

Se han configurado índices compuestos en Prisma para optimizar dashboard:

- `@@index([status, createdAt])`: Para filtros de "Tickets Recientes".
- `@@index([priority, status])`: Para ordenamiento de "Mi Trabajo".

---

## 3. Lógica de Negocio Crítica

### 3.1 Motor SLA (`lib/sla-service.ts` + `ticket-actions.ts`)

El cálculo de fechas de vencimiento es determinista e incluye lógica de pausa.

- **Input**: Prioridad (ej. HIGH = 8 horas), Configuración (Lun-Vie 9-18).
- **Lógica Base**: El algoritmo avanza el tiempo "saltando" noches y fines de semana.
- **Pausa**: Cuando un ticket entra en `WAITING_CUSTOMER`, se registra `slaPausedAt`. Al salir de ese estado, se calcula la diferencia y se empuja el `slaTargetAt` hacia el futuro, garantizando que el tiempo de espera del cliente no penalice al agente.

### 3.2 Asistente LAU (`lib/lau/*`)

Pipeline de procesamiento al crear ticket:

1.  **Detección Idioma**: Regex heurística (ES/EN).
2.  **Análisis Sentimiento**: Búsqueda de keywords negativas.
3.  **Clasificación**: Keywords mapean a Categorías (ej. "factura" -> BILLING).
4.  **Enrutamiento**: Categoría mapea a Departamento.
5.  **Auto-Respuesta**: Envía email inmediato basado en template.

### 3.3 Rate Limiting (`lib/rate-limiter.ts`)

Protección en memoria (Sliding Window) para prevenir abuso:

- **Auth**: 5 intentos / minuto.
- **OTP**: 3 solicitudes / 5 minutos.
- **Tickets**: 10 creaciones / minuto (Aplicado en `/api/tickets`).
- **API General**: 100 peticiones / minuto.

### 3.4 Manejo de Archivos (Uploads)

- **Cliente**: `browser-image-compression` comprime imágenes > 1MB en el navegador antes de subir.
- **Servidor**: Validación estricta de extensiones en `attachment-actions.ts`.
- **Límites**:
  - Max Total Subida: **30MB** (Configurado en `next.config.ts` como 35MB).
  - Max Individual: **10MB**.
  - Max Archivos: **10**.
- **Almacenamiento**: Cloudinary (vía API).

### 3.5 Métricas de Departamentos (`actions/department-actions.ts`)

Sistema de análisis de rendimiento por departamento con filtro temporal dinámico.

**Períodos Disponibles** (`MetricsPeriod`):

- `week`: Últimos 7 días
- `month`: Últimos 30 días
- `quarter`: Últimos 90 días
- `year`: Últimos 365 días
- `all`: Todo el historial

**Métricas Calculadas**:

- **Tickets Totales/Resueltos**: Conteo por estado.
- **Tiempo Promedio Resolución**: (updatedAt - createdAt) para tickets resueltos.
- **CSAT**: Promedio de ratings de encuestas de satisfacción (1-5).
- **SLA Compliance**: % de tickets resueltos antes del deadline.
- **Distribución por Estado**: Pie chart (Open/In Progress/Resolved).
- **Top Performers**: Ranking de colaboradores por tickets resueltos.

**Exclusión de Roles**:
Los siguientes roles se excluyen del ranking de rendimiento técnico:

- `MANAGER`, `ADMIN`, `ROOT`, `VIRTUAL_ASSISTANT`, `CLIENT`

Solo se muestran roles operativos (TECHNICIAN, CONSULTANT, DEVELOPER, etc.).

**Traducciones de Nombres**:
Los nombres de departamentos se traducen dinámicamente usando `Admin.Departments.Names` en los archivos de mensajes.

---

## 4. Seguridad 🔐

### 4.1 Autenticación (Auth.js)

- **Estrategia**: Database Sessions (JWT strategy opcional configurada).
- **Proveedores**: Credentials (Email/Pass) + Custom OTP (Email Code).
- **Middleware**: Intercepta rutas `/admin` y verifica sesión + rol.

### 4.2 Sanitización y Validación

- **HTML**: Stripping total de tags HTML en descripciones con `security-utils.ts` (Anti-XSS).
- **CSP**: Cabeceras `Content-Security-Policy` estrictas configuradas en `next.config.ts`.
- **Input Validation**: Uso de `zod` en Server Actions para validar Enums y datos de entrada antes de procesar.
- **Archivos**: Validación de Magic Numbers y Extensiones en `attachment-actions.ts`.

### 4.3 Protección de Rutas (Middleware)

El archivo `middleware.ts` intercepta todas las peticiones para:

1. **Autenticación**: Redirige a `/login` si no hay sesión.
2. **Routing Internacional**: Maneja prefijos de idioma (`/es`, `/en`).
3. **Roles**: Restringe acceso a `/admin` solo a empleados.

---

## 5. Integraciones y Configuración

### 5.1 Variables de Entorno

Consulte **[ENV_VARS.md](./ENV_VARS.md)** para la lista maestra.
Críticos: `DATABASE_URL`, `AUTH_SECRET`, `NETSUITE_API_KEY`, `CLOUDINARY_URL`.

### 5.2 Webhook NetSuite

- **Endpoint**: `/api/integration/netsuite`
- **Auth**: Header `x-api-key`.
- **Payload**: JSON estricto (Ver [NETSUITE_INTEGRATION.md](./NETSUITE_INTEGRATION.md)).
- **Behavior**: Upsert de Usuario (crea cliente si no existe) + Create Ticket.

### 5.3 Cron Jobs (Mantenimiento)

Endpoint protegido por `CRON_SECRET`.

- `/api/cron/followup`: Ejecutar cada hora.
  - 48h sin actividad de cliente -> Recordatorio.
- `/api/cron/collaborator-inactivity`: Ejecutar cada hora (o diario).
  - 48h sin actividad de técnico en tickets activos -> Alerta por email.
- `/api/cron/automated-reports`: Ejecutar cada hora (Lógica interna valida 9 AM).
  - Genera reportes de rendimiento según configuración (Diario/Semanal/etc).

---

## 6. Despliegue y Operaciones

### 6.1 Build & Start

```bash
npm install
npx prisma generate
npm run build
npx prisma migrate deploy
npm start
```

### 6.2 Health Check

`GET /api/health` retorna estado de DB y sistema.

### 6.3 Logs

Usamos `winston` para logging estructurado JSON en producción.
Nivel configurado por `LOG_LEVEL` (default: info).

---

_Documentación Técnica Maestra - MC Support System_
