# Guía Técnica - MC Support System

**Versión:** 1.0.0
**Fecha de Actualización:** Diciembre 2025
**Mantenedor:** Equipo de Desarrollo Multicomputos

---

## 1. Visión General del Proyecto

MC Support System es una plataforma empresarial para la gestión de tickets de soporte, diseñada para centralizar las solicitudes de clientes internos y externos. La arquitectura está construida sobre **Next.js 15 (App Router)** priorizando el renderizado del lado del servidor (SSR) y la seguridad mediante autenticación robusta y control de acceso basado en roles (RBAC).

### Stack Tecnológico Principal

| Componente | Tecnología | Versión | Propósito |
|---|---|---|---|
| **Framework** | Next.js | 16.0.7 | Framework React Full-stack (App Router, Server Actions) |
| **Lenguaje** | TypeScript | 5.x | Tipado estático y seguridad de código |
| **Base de Datos** | PostgreSQL | - | Motor de base de datos relacional |
| **ORM** | Prisma | 5.22.0 | Capa de acceso a datos y migraciones |
| **Autenticación** | Auth.js (NextAuth) | 5.0 Beta | Gestión de sesiones y proveedores OAuth |
| **Estilos** | Tailwind CSS | 4.0 | Framework de utilidades CSS |
| **UI Components** | Shadcn/UI | - | Componentes de interfaz accesibles y personalizables |
| **Internacionalización** | next-intl | 4.x | Soporte multi-idioma (ES/EN) |

---

## 2. Arquitectura del Sistema

El sistema sigue una arquitectura moderna basada en componentes de servidor (RSC) y Cliente.

### Diagrama de Alto Nivel

```mermaid
graph TD
    Client[Cliente Navegador] -->|HTTP/HTTPS| NextMiddleware[Next.js Middleware]
    NextMiddleware -->|Auth Check| NextServer[Next.js Server]
    
    subgraph "Backend Layer (Server Actions / API)"
        NextServer -->|Prisma Client| DB[(PostgreSQL)]
        NextServer -->|SMTP| Email[Servicio de Correo]
        NextServer -->|REST| Netsuite[ERP Netsuite (Integración)]
    end
    
    subgraph "Frontend Layer"
        Layout --> AuthProvider
        AuthProvider --> AdminLayout
        AdminLayout --> Dashboard
        AdminLayout --> TicketList
    end
```

### Estructura de Directorios

La estructura sigue las convenciones de Next.js App Router:

```
/mc_support
├── /actions          # Server Actions (Lógica de negocio mutacional)
│   ├── auth-actions.ts    # Login, Logout
│   └── ticket-actions.ts  # CRUD de Tickets
├── /app              # Rutas de la aplicación
│   ├── /api          # Endpoints API REST (para integraciones externas)
│   ├── /[locale]     # Rutas internacionalizadas
│   │   ├── (admin)   # Rutas protegidas de administración
│   │   ├── (auth)    # Rutas de autenticación (Login)
│   │   └── (portal)  # Portal de clientes
├── /components       # Componentes React Reutilizables
│   ├── /admin        # Componentes específicos del admin
│   ├── /ui           # Componentes base (Botones, Inputs)
├── /lib              # Utilidades y configuración
│   ├── prisma.ts     # Instancia Singleton de Prisma
│   └── utils.ts      # Helpers generales
├── /prisma           # Esquema de DB y Seeds
└── /public           # Assets estáticos
```

---

## 3. Base de Datos (Modelo de Datos)

El modelo de datos está diseñado para soportar multi-tenancy lógico (departamentos) y una jerarquía de tickets robusta.

### Diagrama Entidad-Relación (ERD)

```mermaid
erDiagram
    User ||--o{ Case : "creates"
    User ||--o{ Case : "assignedTo"
    Department ||--|{ User : "has"
    Department {
        String id PK
        String name
    }
    User {
        String id PK
        String email
        Enum role "MANAGER, TEAM_LEAD, TECHNICIAN, CLIENT"
        String departmentId FK
    }
    Case {
        String id PK
        String ticketNumber "Unique Identifier"
        String title
        Enum status "OPEN, IN_PROGRESS, RESOLVED, CLOSED"
        Enum priority "LOW, MEDIUM, HIGH, CRITICAL"
        String userId FK "Reporter"
        String assignedToId FK "Agent"
    }
    AuditLog {
        String id
        String action
        String entityId
        String actorId
    }

    User ||--o{ AuditLog : "perpestrates"
    Case ||--o{ Attachment : "contains"
```

### Diccionario de Datos Clave

*   **User**: Entidad central. Puede ser un empleado interno o un cliente externo. Se diferencia por el campo `role`.
*   **Case (Ticket)**: La unidad de trabajo principal.
    *   `ticketNumber`: Identificador legible (ej. "CN-SEED-1").
    *   `priority`: Determina SLA (Acuerdo de Nivel de Servicio).
*   **AuditLog**: Tabla inmutable que registra TODOS los cambios críticos (creación, asignación, cambio de estado) para fines de auditoría.

---

## 4. Control de Acceso y Seguridad (RBAC)

El sistema implementa un control de acceso estricto basado en roles.

### Matriz de Permisos

| Permiso / Rol | MANAGER | SERVICE_OFFICER | TEAM_LEAD | TECH_LEAD | TECHNICIAN | DEVELOPER | CLIENT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Ver Dashboard Global** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Ver Tickets Propios** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Ver Tickets del Depto**| ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Crear Tickets** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Asignar Tickets** | ✅ (A todos) | ✅ (A todos) | ✅ (Su Depto) | ✅ (Su Depto) | ❌ | ❌ | ❌ |
| **Cambiar Estado** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Ver Reportes** | ✅ | ❌ | ✅ (Su Depto) | ❌ | ❌ | ❌ | ❌ |
| **Gestionar Usuarios** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Middleware de Protección

El archivo `middleware.ts` intercepta todas las solicitudes.
1.  Verifica la sesión JWT.
2.  Si la ruta es `/admin/*` y no hay sesión -> Redirige a Login.
3.  Si la ruta es `/portal/*` y no hay sesión -> Redirige a Login.
4.  Maneja la detección de idioma (`/es` vs `/en`).

---

## 5. Lógica de Negocio: Gestión de Tickets

### Ciclo de Vida del Ticket

```mermaid
stateDiagram-v2
    [*] --> OPEN: Creado por Cliente/Usuario
    OPEN --> IN_PROGRESS: Asignado a Técnico
    IN_PROGRESS --> WAITING_CUSTOMER: Solicita Info
    WAITING_CUSTOMER --> IN_PROGRESS: Cliente Responde
    IN_PROGRESS --> RESOLVED: Técnico Resuelve
    RESOLVED --> CLOSED: Confirmado o Tiempo Expirado
    CLOSED --> [*]
```

### Reglas de Asignación Automática (Futuro)
Actualmente la asignación es manual, pero el sistema está preparado para reglas de "Round Robin" basadas en el `departmentId` del ticket y la carga de trabajo de los `TECHNICIAN`.

---

## 6. Integraciones (API Routes)

El sistema expone endpoints para interactuar con sistemas externos (ej. ERP Netsuite).

### `POST /api/integration/netsuite`
Endpoint para recibir webhooks desde el ERP.
*   **Auth**: Requiere Header `X-API-KEY`.
*   **Payload**: JSON con datos del cliente y caso.
*   **Lógica**:
    1.  Valida la firma.
    2.  Busca si el cliente existe por email. Si no, lo crea (Auto-provisioning).
    3.  Crea el ticket asociado al cliente.
    4.  Retorna el ID del ticket creado al ERP.

---

## 7. Referencia de Despliegue

### Requisitos Previos
*   Node.js 18+
*   PostgreSQL 14+

### Variables de Entorno (.env)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_URL` | String de conexión a Postgres | `postgresql://user:pass@localhost:5432/db` |
| `AUTH_SECRET` | Llave para firmar JWT | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL canónica del sitio | `http://localhost:3000` |

### Comandos de Mantenimiento

*   **Inicializar DB**: `npx prisma migrate dev`
*   **Poblar Datos**: `npx prisma db seed`
*   **Generar Cliente**: `npx prisma generate`
*   **Build Producción**: `npm run build`
*   **Iniciar Producción**: `npm run start`

### Pruebas Automatizadas

El proyecto utiliza **Vitest** para pruebas unitarias y de componentes.

*   **Ejecutar Pruebas**: `npm run test`
*   **Modo Watch**: El comando se ejecuta en modo watch por defecto.
*   **Ubicación**:
    *   Unitarias: Junto al archivo fuente (ej. `lib/utils.test.ts`)
    *   Componentes: Junto al componente (ej. `components/ui/button.test.tsx`)

### Integración Continua (CI/CD)

> [!NOTE]
> **¿Qué es esto?** La Integración Continua (CI) es como un "corrector automático" para su código. Imagine que tiene un robot que revisa su trabajo cada vez que guarda un cambio. Si comete un error, el robot le avisa antes de que el problema llegue a los usuarios finales.

Hemos configurado un sistema automatizado utilizando **GitHub Actions** para proteger la calidad del proyecto.

#### 📁 Archivo de Configuración
Todo el comportamiento está definido en el archivo: `.github/workflows/ci.yml`

#### 🔄 Flujo de Trabajo (Pipeline)
Cada vez que un programador sube cambios (`push`) o propone cambios (`pull request`) a las ramas principales (`main` o `develop`), se activa automáticamente este proceso de 3 pasos:

```mermaid
graph LR
    A[Cambio de Código] --> B(GitHub Actions)
    B --> C{Paso 1: Linter}
    C -- Pasa --> D{Paso 2: Pruebas}
    C -- Falla --> Z[❌ Error Reportado]
    D -- Pasa --> E{Paso 3: Build}
    D -- Falla --> Z
    E -- Pasa --> F[✅ Código Seguro]
    E -- Falla --> Z
```

1.  **Paso 1: Linter (`npm run lint`)**
    *   **¿Qué hace?**: Revisa el estilo de escritura del código. Busca errores de sintaxis, variables no usadas y malas prácticas.
    *   **Beneficio**: Mantiene el código limpio y ordenado, fundamental para que futuros programadores lo entiendan.

2.  **Paso 2: Pruebas (`npm run test`)**
    *   **¿Qué hace?**: Ejecuta simulaciones automáticas (como las pruebas del Botón que creamos). Verifica que las funciones matemáticas y los componentes visuales actúen como se espera.
    *   **Beneficio**: Asegura que una "mejora" en una parte del sistema no rompa otra parte por accidente.

3.  **Paso 3: Build (`npm run build`)**
    *   **¿Qué hace?**: Intenta compilar toda la aplicación como si fuera a salir a producción.
    *   **Beneficio**: Garantiza que la aplicación es técnicamente viable y no tiene errores estructurales graves que impidan su funcionamiento.

#### 🛡️ Por qué es importante para su Negocio
Este sistema actúa como una **póliza de seguro**. Impide que código defectuoso llegue a su servidor de producción. Si alguno de estos 3 pasos falla, GitHub bloqueará el cambio y avisará al equipo para que lo corrija antes de continuar.

### Endurecimiento de Seguridad (Security Hardening)

Hemos configurado cabeceras HTTP estrictas para proteger la aplicación contra ataques comunes.

*   **Archivo**: `next.config.ts`
*   **Cabeceras Implementadas**:
    1.  **HSTS**: Obliga a los navegadores a usar siempre HTTPS.
    2.  **X-Frame-Options**: `SAMEORIGIN` (Evita que otros sitios "embeban" nuestra app, protegiendo contra Clickjacking).
    3.  **X-Content-Type-Options**: `nosniff` (Evita inyección de scripts por confusión de tipos MIME).
    4.  **Permissions-Policy**: Protege la privacidad del usuario bloqueando hardware innecesario.
        *   ✅ **Cámara**: Permitida (`self`) para permitir subir fotos en tickets.
        *   ❌ **Micrófono/Geolocalización**: Bloqueados por defecto.

---
*Documento generado por el Agente de Desarrollo - MC Support.*

---

## 8. Sistema de Notificaciones y Asistente Virtual LAU

### 8.1 Arquitectura de Notificaciones

El sistema implementa un robusto sistema de notificaciones por email que mantiene informados a clientes y equipo sobre cambios en tickets.

#### Componentes Principales

```mermaid
graph TD
    A[Evento: Ticket Creado/Actualizado] --> B{¿Quién ejecuta?}
    B -->|LAU| C[assistant-service.ts]
    B -->|Equipo| D[ticket-actions.ts]
    C --> E[getTicketRecipients]
    D --> E
    E --> F[email-service.ts]
    F --> G{SMTP Configurado?}
    G -->|Sí| H[Nodemailer: Enviar Email]
    G -->|No| I[Mock: Console Log]
    H --> J[Cliente + CCs reciben email]
```

#### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `lib/email-service.ts` | Servicio de envío de emails con soporte CC |
| `lib/email-templates.ts` | Plantillas HTML para emails |
| `lib/assistant-service.ts` | Lógica de LAU (asistente virtual) |
| `lib/ticket-helpers.ts` | Helper para obtener destinatarios (to + cc) |
| `actions/ticket-actions.ts` | Server actions con notificaciones |

### 8.2 Asistente Virtual LAU (Logical Assistance Unit)

LAU es un sistema automatizado que analiza y responde a tickets nuevos.

#### Funcionalidades

1. **Análisis de Sentimiento**
   - Detecta tono positivo, neutral o negativo
   - Ajusta prioridad basada en urgencia detectada

2. **Respuesta Automática**
   - Envía mensaje de bienvenida 30s después de crear ticket
   - Personaliza respuesta según horario laboral
   - Notifica al cliente por email con plantilla `assistantResponseEmail`

3. **Escalamiento Inteligente**
   - Eleva prioridad a CRITICAL si detecta sentimiento negativo
   - Envía alerta a supervisores vía email

#### Configuración (SystemConfig)

```typescript
{
  assistantEnabled: boolean;      // Habilitar/deshabilitar LAU
  assistantName: string;          // Nombre personalizable
  businessHoursStart: number;     // Hora inicio (0-23)
  businessHoursEnd: number;       // Hora fin (0-23)
  supportEmail: string;           // Email para alertas
}
```

### 8.3 Sistema de Copias (CC) en Emails

#### Modelo de Datos

**Cambio en schema.prisma:**
```prisma
model Case {
  // ... campos existentes ...
  ccEmails String[] @default([])  // Array de emails para CC
}
```

**Migración:** `add_cc_emails_to_tickets`

#### Flujo de Procesamiento

1. **Creación de Ticket**
   ```typescript
   // En portal-ticket-actions.ts
   const ccEmailsRaw = formData.get('ccEmails')?.toString() || '';
   const ccEmails = ccEmailsRaw.split(',')
       .map(email => email.trim())
       .filter(email => z.string().email().safeParse(email).success);
   ```

2. **Obtención de Destinatarios**
   ```typescript
   // ticket-helpers.ts
   export async function getTicketRecipients(ticketId: string): Promise<{
       to: string | null;
       cc: string[];
   }> {
       const ticket = await prisma.case.findUnique({
           where: { id: ticketId },
           select: {
               user: { select: { email: true } },
               ccEmails: true
           }
       });
       
       return {
           to: ticket.user.email,
           cc: ticket.ccEmails || []
       };
   }
   ```

3. **Envío con CC**
   ```typescript
   // email-service.ts
   await sendEmail({
       to: recipients.to,
       cc: recipients.cc,  // ← Soporte CC
       subject: "...",
       body: "..."
   });
   ```

### 8.4 Auto-Cierre y Auto-Reopening

#### Estados del Ticket y Transiciones

```mermaid
stateDiagram-v2
    [*] --> OPEN: Cliente crea ticket
    OPEN --> IN_PROGRESS: LAU/Equipo responde
    IN_PROGRESS --> WAITING_CUSTOMER: Solicita info
    WAITING_CUSTOMER --> RESOLVED: Cliente cierra ✅
    WAITING_CUSTOMER --> IN_PROGRESS: Cliente responde 🔄
    RESOLVED --> [*]
```

#### Lógica de Auto-Reopening

**Ubicación:** `actions/ticket-actions.ts` → `addMessage()`

```typescript
// Si el cliente responde y está en WAITING_CUSTOMER
if (isClient && ticket.status === 'WAITING_CUSTOMER') {
    await prisma.case.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' }
    });
    
    // Notificar al equipo
    await sendEmail({
        to: config?.supportEmail,
        subject: `Cliente respondió - Ticket #${ticket.ticketNumber}`,
        body: `El estado cambió automáticamente a EN PROGRESO.`
    });
}
```

#### API Route para Cierre desde Email

**Endpoint:** `GET /api/tickets/[id]/close`

**Flujo:**
1. Valida autenticación (redirige a login si no autenticado)
2. Verifica propiedad del ticket
3. Valida estado = WAITING_CUSTOMER
4. Actualiza estado a RESOLVED
5. Crea mensaje automático vía LAU
6. Registra en AuditLog
7. Notifica al equipo
8. Redirige al portal con éxito

**Seguridad:**
- Solo el dueño del ticket puede cerrarlo
- Solo funciona en estado WAITING_CUSTOMER
- Requiere autenticación válida

### 8.5 Plantillas de Email (Templates)

#### Plantillas Implementadas

| Template | Cuándo se usa | Características |
|----------|---------------|-----------------|
| `assistantResponseEmail` | LAU responde al ticket | - Emoji 🤖<br>- Conversión markdown a HTML<br>- Link al ticket |
| `newMessageEmail` | Equipo envía mensaje | - Muestra remitente<br>- Botón "Responder"<br>- Contenido formateado |
| `statusChangeEmail` | Cambio de estado | - Muestra nuevo estado<br>- **Botón de cierre** si WAITING_CUSTOMER<br>- Link actualizado |

#### Ejemplo: Botón de Cierre Condicional

```typescript
// En statusChangeEmail()
if (newStatus === 'WAITING_CUSTOMER' && ticketId) {
    const closeUrl = `${process.env.NEXTAUTH_URL}/api/tickets/${ticketId}/close`;
    
    closeButton = `
        <div style="background-color: #f0f9ff; ...">
            <p>¿Tu problema fue resuelto?</p>
            <a href="${closeUrl}" style="...">
                ✅ Cerrar Ticket
            </a>
        </div>
    `;
}
```

### 8.6 Variables de Entorno Adicionales

| Variable | Descripción | Requerido | Ejemplo |
|----------|-------------|-----------|---------|
| `SMTP_HOST` | Servidor SMTP | Producción | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | Producción | `587` |
| `SMTP_SECURE` | Usar SSL/TLS | Producción | `false` |
| `SMTP_USER` | Usuario SMTP | Producción | `no-reply@empresa.com` |
| `SMTP_PASS` | Contraseña SMTP | Producción | `***` |
| `SMTP_FROM` | Remitente por defecto | Producción | `"MC Support" <no-reply@empresa.com>` |

**Modo Development:** Sin configurar SMTP, el sistema usa un servicio mock que imprime emails en `console.log`.

### 8.7 Índices de Performance (Actualización)

Se mantienen los índices existentes más los optimizados previamente para consultas de tickets y mensajes.

### 8.8 Logs y Monitoreo

El sistema usa `lib/logger.ts` para registrar eventos clave:

**Eventos logged:**
- `[Assistant] Sent email notification to ...` - Email de LAU enviado
- `[Ticket] Sent new message notification to ...` - Email del equipo enviado
- `[Ticket] Auto-reopened ticket ...` - Auto-reopening ejecutado
- `Email sent: ${messageId}` - Confirmación de envío SMTP

### 8.9 Testing de Notificaciones

#### Checklist de Verificación

- [ ] LAU envía email al crear ticket (verificar en 30s)
- [ ] Email incluye plantilla correcta (`assistantResponseEmail`)
- [ ] CCs reciben copia del email
- [ ] Equipo puede enviar mensaje y cliente recibe notificación
- [ ] Botón "Cerrar Ticket" aparece solo en WAITING_CUSTOMER
- [ ] Cierre desde portal funciona
- [ ] Cierre desde email funciona y redirige correctamente
- [ ] Auto-reopening al responder funciona
- [ ] Equipo recibe notificación de auto-reopening

#### Comandos de Testing

```bash
# Verificar migraciones aplicadas
npx prisma migrate status

# Ver estructura de BD incluyendo ccEmails
npx prisma studio

# Logs en tiempo real
# (El dev server muestra logs de emails mock si SMTP no está configurado)
npm run dev
```

---

**Última actualización:** Diciembre 2025  
**Versión:**2.0.0 (con LAU, CC y Auto-Cierre)

---

## 9. Autenticación OTP para Clientes

### 9.1 Arquitectura

Los clientes acceden sin contraseña mediante códigos de un solo uso (OTP).

#### Modelo de Datos

```prisma
model LoginOTP {
  id        String   @id @default(cuid())
  email     String
  code      String    // 6 dígitos
  expiresAt DateTime  // Válido 10 minutos
  used      Boolean   @default(false)
  createdAt DateTime  @default(now())
  
  @@index([email, expiresAt])
  @@index([email, used])
}
```

#### Flujo

1. **Request OTP** (`actions/otp-actions.ts` → `requestOtp`)
   - Valida que email está en `AllowedClientEmail`
   - Genera código aleatorio de 6 dígitos
   - Expira en 10 minutos
   - Envía email con código
   - Retorna success

2. **Verify OTP** (`actions/otp-actions.ts` → `verifyOtpAction`)
   - Busca código no usado y no expirado
   - Marca código como `used = true`
   - Crea sesión con Auth.js
   - Retorna token de sesión

#### Seguridad

- Código solo válido 1 vez
- Expira en 10 minutos
- Solo emails preautorizados
- Intentos ilimitados (considerar rate limiting en producción)

---

## 10. Base de Conocimientos (Knowledge Base)

### 10.1 Modelo de Datos

```prisma
model Article {
  id          String   @id @default(cuid())
  title       String
  content     String   // Markdown
  category    String
  published   Boolean  @default(false)
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 10.2 Server Actions

| Action | Archivo | Propósito |
|--------|---------|-----------|
| `createArticle` | `kb-actions.ts` | Crea artículo (borrador o publicado) |
| `updateArticle` | `kb-actions.ts` | Edita artículo existente |

### 10.3 Rutas

- **Admin**: `/admin/kb` - CRUD completo
- **Portal**: `/portal/kb` - Solo lectura de publicados
- **Detalle**: `/portal/kb/[slug]` - Contenido completo

### 10.4 Características

- Contenido en **Markdown** (convertido a HTML en cliente)
- **Categorías** personalizables
- **Estado**: Publicado / Borrador
- **Búsqueda** full-text en títulos

---

## 11. Analytics y Reportes

### 11.1 Implementación

**Archivo:** `actions/analytics-actions.ts` → `getAnalytics(period)`

#### Períodos Soportados

```typescript
type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';
```

#### Métricas Calculadas

1. **Summary**
   - `total`: Count de tickets en período
   - `open`: Tickets no resueltos
   - `resolved`: Tickets cerrados/resueltos
   - `resolutionRate`: (resolved / total) * 100

2. **Por Estado** (`groupBy status`)
   - Distribución actual de tickets

3. **Por Prioridad** (`groupBy priority`)
   - Desglose de severidad

4. **Tendencias**
   - Usa `eachDayOfInterval` para llenar gaps
   - Map JS para agregar por día
   - Retorna array de `{ date, tickets, resolved }`

#### RBAC

- **Managers**: Vista global
- **Team Leads**: Solo su departamento (futuro)
- **Otros**: Acceso denegado

---

## 12. Búsqueda Global

### 12.1 Implementación

**Archivo:** `actions/search-actions.ts` → `searchGlobal(query)`

#### Alcance

Busca en paralelo (`Promise.all`):
- **Tickets**: `ticketNumber`, `title`, `description`
- **Usuarios**: `name`, `email`
- **Artículos**: `title`

#### Límites

- Mínimo 2 caracteres
- Máximo 5 resultados por tipo
- Case-insensitive (`mode: 'insensitive'`)

#### Retorno

```typescript
{
  tickets: Array<{id, ticketNumber, title}>,
  users: Array<{id, name, email, role}>,
  articles: Array<{id, title}>
}
```

---

## 13. Registro de Auditoría (Audit Log)

### 13.1 Modelo de Datos

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  action    String   // CREATE, UPDATE, ASSIGN, DELETE, etc.
  entity    String   // TICKET, USER, SYSTEM
  entityId  String   // ID del objeto afectado
  actorId   String
  actor     User     @relation(fields: [actorId], references: [id])
  details   Json?    // Metadata adicional
  createdAt DateTime @default(now())
  
  @@index([entityId])
  @@index([actorId])
  @@index([createdAt])
  @@index([entity, entityId])
}
```

### 13.2 Servicio

**Archivo:** `lib/audit-service.ts`

```typescript
export async function createAuditLog(
  action: string,
  entity: string,
  entityId: string,
  actorId: string,
  details?: any
)
```

### 13.3 Eventos Registrados

- Creación de tickets
- Cambios de estado
- Asignaciones/reasignaciones
- Cierre por cliente
- Creación/eliminación de usuarios
- Cambios en configuración del sistema

### 13.4 Características

- **Inmutable**: No se pueden editar/eliminar registros
- **Compliance**: Auditoría completa para ISO/SOC2
- **Búsqueda**: Por entidad, actor o fecha
- **Vista**: `/admin/audit` (solo Managers)

---

## 14. Gestión de Adjuntos

### 14.1 Modelo de Datos

```prisma
model Attachment {
  id        String   @id @default(cuid())
  name      String   // Nombre original
  url       String   // Path en /public/uploads
  size      Int      // Bytes
  type      String   // MIME type
  ticketId  String
  ticket    Case     @relation(fields: [ticketId], references: [id])
  userId    String
  uploader  User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
}
```

### 14.2 Límites y Validación

| Límite | Valor | Ubicación |
|--------|-------|-----------|
| Archivos por ticket | 10 | `attachment-actions.ts` |
| Tamaño por archivo | 5MB | `attachment-actions.ts` |
| Tamaño total (formulario) | 20MB | `ticket-form.tsx` |

### 14.3 Almacenamiento

- **Directorio**: `/public/uploads/`
- **Nombre**: `{timestamp}-{sanitized_filename}`
- **Acceso**: Público vía `/uploads/...`

### 14.4 Upload

```typescript
// actions/attachment-actions.ts
export async function uploadAttachment(formData: FormData)
```

**Proceso:**
1. Validar tamaño (5MB)
2. Validar límite de archivos (10)
3. Sanitizar nombre de archivo
4. Escribir en `/public/uploads/`
5. Crear registro en BD
6. Revalidar paths afectados

---

## 15. API de Integración - Netsuite

### 15.1 Endpoint

**Ruta:** `POST /api/integration/netsuite`

**Autenticación:** Header `X-API-KEY`

### 15.2 Payload Esperado

```json
{
  "customerEmail": "cliente@empresa.com",
  "customerName": "Juan Pérez",
  "ticketTitle": "Problema con factura",
  "ticketDescription": "Detalle completo del problema...",
  "priority": "MEDIUM"
}
```

### 15.3 Flujo

1. **Validar API Key**
   ```typescript
   const apiKey = request.headers.get('X-API-KEY');
   if (apiKey !== process.env.NETSUITE_API_KEY) {
     return 401 Unauthorized
   }
   ```

2. **Auto-provisioning de Usuario**
   - Buscar usuario por email
   - Si no existe → Crear como `role: CLIENT`
   - Agregar a `AllowedClientEmail` automáticamente

3. **Crear Ticket**
   - Asociar a usuario (existente o nuevo)
   - Asignar prioridad
   - LAU procesará en 30s

4. **Retornar** 
   ```json
   {
     "success": true,
     "ticketId": "clxxx...",
     "ticketNumber": "CN-2024-123"
   }
   ```

### 15.4 Seguridad

- API Key en variable de entorno
- Validación de schema con Zod
- Rate limiting **recomendado** (no implementado)

---

## 16. Deployment con Docker

### 16.1 Archivos

- **Dockerfile**: Multi-stage build con Next.js standalone
- **docker-compose.yml**: Stack completo (App + PostgreSQL)
- **.dockerignore**: Excluye `node_modules`, `.git`, etc.

### 16.2 Build

```bash
docker build -t mc-support:latest .
```

**Stages:**
1. `deps`: Instala dependencias
2. `builder`: Build de Next.js
3. `runner`: Image final con standalone output

### 16.3 Run con Docker Compose

```bash
docker-compose up -d
```

**Servicios:**
- `app`: Next.js en puerto 3000
- `database`: PostgreSQL 14

**Volúmenes:**
- `postgres_data`: Persistencia de BD
- `./uploads`: Adjuntos

### 16.4 Variables de Entorno

Ver `.env.example` para template completo.

**Críticas:**
- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `SMTP_*` (producción)

---

## 17. Logging del Sistema

### 17.1 Implementación

**Archivo:** `lib/logger.ts`

Usa `winston` con formato JSON structurado.

#### Niveles

```typescript
{
  error: 0,   // Errores críticos
  warn: 1,    // Advertencias
  info: 2,    // Información general
  debug: 3    // Debug (solo development)
}
```

#### Transports

- **Console**: Always enabled
- **File**: `logs/combined.log` (rotación diaria)
- **Error File**: `logs/error.log` (solo errors)

### 17.2 Uso

```typescript
import { logger } from '@/lib/logger';

logger.info('Ticket created', { ticketId, userId });
logger.error('Email send failed', { error, ticketId });
```

### 17.3 Rotación

- **Max Size**: 10MB por archivo
- **Max Files**: 14 días de logs
- **Compresión**: Automática (gzip)

---

**Última actualización:** Diciembre 2025  
**Versión:** 2.0.0 (Documentación Completa)
