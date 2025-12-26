# Integración con NetSuite ERP

Esta guía detalla cómo configurar y utilizar la integración entre NetSuite y el Sistema de Soporte MC.

## 1. Configuración

### Variable de Entorno

Para asegurar que solo NetSuite pueda crear tickets, el sistema utiliza una API Key.
Debes configurar la siguiente variable en Railway:

`NETSUITE_API_KEY=tu_clave_secreta_aqui`

> **Nota:** Esta clave debe coincidir con la que se configure en el script de NetSuite.

## 2. Endpoint del Webhook

El sistema expone la siguiente ruta para recibir datos:

- **URL:** `https://tu-dominio.com/api/integration/netsuite`
- **Método:** `POST`
- **Headers:**
  - `Content-Type: application/json`
  - `x-api-key: <TU_NETSUITE_API_KEY>`

## 3. Payload (Datos a Enviar)

El cuerpo del JSON debe tener la siguiente estructura estricta:

```json
{
  "externalId": "123456", // ID único del caso en NetSuite (Requerido)
  "title": "Error en Facturación", // Título del ticket (Requerido)
  "description": "Detalle...", // Descripción completa (Requerido)
  "customerEmail": "cliente@x.com", // Email del cliente (Requerido)
  "customerName": "Juan Pérez", // Nombre del cliente (Opcional)
  "priority": "MEDIUM" // Opcional. Valores: LOW, MEDIUM, HIGH, CRITICAL. Default: MEDIUM
}
```

### Comportamiento

1.  **Validación**: Se verifica la firma (`x-api-key`) y los datos.
2.  **Auto-Provisioning**: Si el `customerEmail` no existe en el sistema de soporte, se crea automáticamente una cuenta de usuario con rol `CLIENT`.
3.  **Creación**: Se crea el ticket asociado a ese usuario.
4.  **Mapeo**: El número de ticket en el portal será `NS-{externalId}` (ej. `NS-123456`).

## 4. Respuesta

**Éxito (200 OK):**

```json
{
  "success": true,
  "message": "Ticket created from Netsuite",
  "ticketNumber": "NS-123456",
  "caseId": "cm..."
}
```

**Error (400 Bad Request):**

- Si faltan campos (ej. `externalId`).
- Si el email es inválido.

**Error (401 Unauthorized):**

- Si la `x-api-key` no coincide.

## 5. Sincronización Saliente (App -> NetSuite)

La integración también permite que los cambios en el portal se reflejen en NetSuite (Bidireccional).

### Requisitos

Debes configurar **Token Based Authentication (TBA)** en NetSuite y agregar las credenciales al `.env`:

```properties
NETSUITE_ACCOUNT_ID="123456"
NETSUITE_CONSUMER_KEY="..."
NETSUITE_CONSUMER_SECRET="..."
NETSUITE_TOKEN_ID="..."
NETSUITE_TOKEN_SECRET="..."
NETSUITE_REST_DOMAIN="https://123456.suitetalk.api.netsuite.com"
```

### Eventos Sincronizados

1.  **Creación de Ticket**: Se crea un `Support Case` en NetSuite inmediatamente.
2.  **Mensajes**: Las respuestas del cliente o agentes se envían como `Message` al caso.
3.  **Estado/Prioridad**: Los cambios de estado (OPEN -> RESOLVED) actualizan el registro en el ERP.

> **Nota**: Si faltan las variables de entorno, el sistema operará en **Modo Simulación**, registrando en logs lo que _hubiera_ enviado, sin romper el flujo del usuario.
