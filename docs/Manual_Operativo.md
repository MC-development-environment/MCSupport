# Manual Operativo: Administración y Soporte 🛠️

**Versión:** 3.3.0 (Granular)
**Audiencia:** Gerentes, Técnicos y Operativos.

Este manual documenta exhaustivamente cada funcionalidad de la plataforma, validada contra el código fuente.

---

## 🔭 Navegación Superior (Top Bar)

La barra superior contiene herramientas globales accesibles desde cualquier pantalla:

1.  **Buscador Global**: (Ctrl+K) Permite buscar tickets, usuarios o artículos KB desde cualquier lugar.
2.  � **Selector de Idioma**: Cambie la interfaz entre Inglés y Español. Las notificaciones automáticas también respetarán esta preferencia.
3.  🌗 **Selector de Tema**:
    - _Light_: Fondo blanco, estándar para oficinas iluminadas.
    - _Dark_: Fondo oscuro, ideal para reducir fatiga visual en turnos nocturnos.
    - _System_: Se adapta a la configuración de su sistema operativo.
4.  👤 **Menú de Usuario**: Acceso rápido a Logout y Configuración Personal.

---

## 1. �🏁 Panel de Control (Dashboard)

**Ruta**: `/admin`
**Componente**: `AdminPage` + `DashboardStats`

El dashboard ofrece una vista táctica de alto nivel. Los datos se refrescan cada 5 minutos.

### Tarjetas de Métricas (KPIs)

1.  **Total Tickets**: Volumen histórico acumulado. Crecimiento vs mes anterior.
2.  **Open Cases**: Tickets en estado `OPEN` o `IN_PROGRESS`.
3.  **Avg Response Time**: Tiempo medio desde _Creación_ hasta _Primera Respuesta_.
    - 🟢 < 60 mins
    - 🟡 < 240 mins
    - 🔴 > 240 mins
4.  **Customer Sat**: Índice CSAT basado en encuestas.

### Tablas y Widgets

- **Recent Tickets**: Últimos 5 tickets. Muestra ID, Cliente, Fecha, Prioridad y Estado.
- **System Health**: Muestra el estado de la conexión con NetSuite API.

---

## 2. ⏳ My Work (Mi Trabajo)

**Ruta**: `/admin/dashboard/my-work`
**Lógica**: Filtro implícito sobre la vista de Tickets.

Esta vista está diseñada para la ejecución. A diferencia de la lista general, esta vista aplica una lógica de ordenamiento forzado:

1.  **Filtro**: Solo muestra tickets donde `assignedToId` == Su Usuario.
2.  **Orden**: Ascendente por `slaTargetAt`.
    - Los tickets próximos a vencer (o ya vencidos) aparecen SIEMPRE arriba.
    - No se puede cambiar el orden de esta lista; está diseñada para evitar cherry-picking.

---

## 3. 🎫 Tickets (Gestión Global)

**Ruta**: `/admin/tickets`

### Barra de Herramientas

- **Buscador**: Búsqueda "fuzzy" insensible a mayúsculas. Busca en: Título, Número de Ticket, Nombre de Cliente.
- **Filtro Departamento**: Lista desplegable dinámica basada en los departamentos activos.
- **Filtro Asignado**: Permite ver la carga de un compañero específico o buscar tickets sin asignar ("Unassigned").

### Tabla de Datos

Columnas interactivas (Click para ordenar):

- `Ticket #`: ID único.
- `Title`: Asunto cortado si es muy largo.
- `Customer`: Nombre y Email.
- `Priority`: Badge (Low, Medium, High, Critical).
- `Status`: Badge de estado.
- `Category`: Clasificación dada por LAU.
- `Assignee`: Agente responsable.
- `Date`: Fecha de creación (DD-MM-YYYY HH:mm).

### Acciones Masivas (Bulk Actions)

Desde la lista principal:

1.  **Selección**: Use las casillas de verificación (checkboxes) a la izquierda de cada fila.
2.  **Barra de Acciones**: Al seleccionar uno o más tickets, aparecerá una barra flotante en la parte superior.
3.  **Operaciones Disponibles**:
    - **Cambiar Estado**: Actualice el estado de múltiples casos simultáneamente (ej. cerrar lotes de tickets resueltos).
    - **Asignar Agente**: Distribuya un lote de tickets a un técnico específico.

### Detalle del Ticket (Vista Individual)

Al entrar a un ticket:

- **Encabezado**: Muestra el semáforo SLA en tiempo real.
  - _Nota_: Si el estado es `WAITING_CUSTOMER`, el reloj SLA se **pausa** automáticamente.
- **Acciones Rápidas**:
  - _Take it_: Asignarse el ticket a uno mismo.
  - _Change Status_: Desplegable de transición de estados.
- **Pestañas**:
  - _Conversation_: Hilo de correos.
    - **Notas Internas**: Los agentes pueden marcar "Nota Interna (Privada)" al enviar un mensaje. Estos mensajes aparecen en amarillo y **NO son visibles para el cliente**.
  - _Files_: Galería de adjuntos.

### Flujo de Resolución

1.  **Resolver**: Al marcar un ticket como `RESOLVED`, el cliente recibe una notificación.
2.  **Auto-Finalización**: Un cron job verifica tickets resueltos hace **más de 24 horas**. Si el cliente no ha interactuado, se cierra automáticamente (`CLOSED`).
3.  **Encuesta**: Al cerrarse, se envía automáticamente una encuesta al cliente. El resultado se vincula al agente que resolvió el caso.

---

## 4. 📖 Base de Conocimiento (KB)

**Ruta**: `/admin/kb`

### Flujo de Publicación

1.  **Borrador (Draft)**: Estado inicial. Solo visible para agentes.
2.  **Publicado (Published)**: Visible para clientes en el Portal y sugereible por LAU.

### Editor

- Soporta formato **Markdown** básico.
- **Categoría**: Obligatoria. Se usa para el algoritmo de coincidencia de LAU. Antes de crear un artículo, asegúrese de que la categoría exista.

---

## 5. 📄 Reportes (Analytics)

**Ruta**: `/admin/reports`
**Tecnología**: Recharts

Este módulo procesa métricas en tiempo real.

### Filtros de Tiempo

Selector de rango preciso:

- `Last 7 days` (Semanal)
- `Last 30 days` (Mensual)
- `Last 90 days` (Trimestral)
- `Last 180 days` (Semestral)
- `Last 365 days` (Anual)
- `All Time` (Histórico completo)

### Filtro de Personal

- Puede ver las métricas globales o filtrar por un agente específico para evaluación de desempeño.

### Visualizaciones

1.  **Tendencia de Volumen (Area Chart)**:
    - Azul: Nuevos Tickets.
    - Verde: Tickets Resueltos.
    - Permite ver picos de carga de trabajo.
2.  **Distribución de Estado (Pie Chart)**:
    - Proporción de tickets abiertos vs cerrados.
3.  **Desglose por Prioridad (Bar Chart)**:
    - ¿Cuántos tickets críticos estamos recibiendo?
4.  **KPIs Críticos**:
    - _Resolution Rate_: % de tickets resueltos sobre el total recibido.
    - _SLA Compliance_: % de tickets cerrados DENTRO del tiempo objetivo. (Meta: 90%).
    - _Overdue_: Conteo absoluto de tickets vencidos actualmente.

### Exportación

- Botón **Drowndown "Download"**: Permite descargar un CSV crudo con los datos del periodo seleccionado.

---

## 6. 👥 Usuarios

**Ruta**: `/admin/users`
**(Rol Requerido: MANAGER)**

### Formulario de Usuario

Campos obligatorios al crear/editar:

- `Name`
- `Email`
- `Role`: Manager, Team Lead, Technician, Consultant, Developer, Service Officer, Client.
- `Department`: (Requerido si el rol es técnico).
- `Skills`: Etiquetas de habilidades (ej. "Netsuite", "Infrastructure") usadas para la auto-asignación inteligente.

---

## 7. ⚙️ Configuración

**Ruta**: `/admin/settings`

### Pestaña: Perfil

- Información básica del usuario logueado.

### Pestaña: Seguridad

- **Two-Factor Authentication (2FA)**:
  - Configuración via código QR (Compatible con Google/Microsoft Authenticator).
  - Requiere contraseña actual para confirmar cambios.

### Pestaña: Sistema (Managers)

Configuración global almacenada en base de datos:

1.  **General**: Nombre de la empresa, Email de soporte.
2.  **Modo Mantenimiento**: Switch global para bloquear acceso al portal.
3.  **Adjuntos**:
    - _Máximo por archivo (MB)_: **10MB** por archivo (30MB total).
    - _Tipos permitidos_: Lista de extensiones (ej. .jpg,.pdf).
4.  **Asistente (LAU)**:
    - Switch global para activar/desactivar el asistente.
    - Nombre del asistente: Personalización del nombre en correos.
5.  **SLA Targets**:
    - Definición de horas por prioridad (Low, Medium, High, Critical).
6.  **Horario de Trabajo**:
    - Definición de hora inicio/fin y días laborales. Afecta el cálculo de fechas de vencimiento.

---

_Documentación validada técnicamente - Diciembre 2025_
