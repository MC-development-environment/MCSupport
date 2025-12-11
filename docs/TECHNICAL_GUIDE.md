# Guía Técnica - MCSupport

## Arquitectura del Sistema

MCSupport sigue una arquitectura modular basada en **Next.js App Router**. El sistema está dividido en capas lógicas:

### 1. Enrutamiento e Internacionalización
El sistema utiliza un enfoque de enrutamiento dinámico `[locale]` para manejar idiomas.
*   **Middleware**: `middleware.ts` intercepta todas las peticiones para:
    1.  Verificar la sesión del usuario (Auth.js) en rutas `/admin`.
    2.  Redirigir al locale correspondiente (next-intl) si no existe.
*   **Rutas**:
    *   `/es/admin/*`: Rutas protegidas en español.
    *   `/en/admin/*`: Rutas protegidas en inglés.
    *   `/api/*`: Rutas de API (no localizadas).

### 2. Base de Datos (Prisma ORM)
El esquema de datos (`prisma/schema.prisma`) define las entidades principales:
*   **User**: Administradores y Clientes.
*   **Case**: Tickets de soporte.
*   **Article**: Artículos de la base de conocimiento (KB).
*   **Category**: Categorías para KB.

### 3. Autenticación
Usa **Auth.js v5** con estrategia JWT.
*   **Configuración**: `auth.config.ts` define las reglas de borde.
*   **Adaptador**: Prisma Adapter para persistencia de usuarios (opcional, actualmente usa Credentials strategy custom).
*   **Protección**: Middleware manual en `middleware.ts` redirige explícitamente si no hay sesión.

## API de Integración (Netsuite)

El sistema expone un endpoint REST para recibir tickets desde el ERP Netsuite.

### Crear Ticket (Webhook)

**Endpoint**: `POST /api/integration/netsuite`
**Headers**:
*   `Content-Type`: `application/json`
*   `x-api-key`: `[NETSUITE_API_KEY]`

**Payload**:
```json
{
  "externalId": "CASE-999",
  "title": "Error en facturación",
  "description": "El cliente reporta error 500 al facturar.",
  "priority": "HIGH",
  "customerEmail": "cliente@empresa.com",
  "customerName": "Juan Pérez"
}
```

**Respuesta Exitosa (200)**:
```json
{
  "success": true,
  "message": "Ticket created from Netsuite",
  "ticketNumber": "NS-CASE-999",
  "caseId": "cm...."
}
```

**Comportamiento**:
Si el `customerEmail` no existe en la base de datos `User`, el sistema crea automáticamente una cuenta con rol `USER` para ese cliente.

## Scripts Utilitarios

*   `npm run dev`: Inicia entorno local.
*   `npm run build`: Compila para producción.
*   `npx prisma db seed`: Reinicia la BD con datos de prueba.
