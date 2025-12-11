# Manual de Usuario - Sistema de Soporte MC Support

Bienvenido al manual de usuario del sistema de gestión de soporte de Multicomputos. Este documento le guiará a través de las funcionalidades principales de la aplicación.

## Tabla de Contenidos
1. [Inicio de Sesión](#1-inicio-de-sesión)
2. [Dashboard Principal](#2-dashboard-principal)
3. [Gestión de Tickets](#3-gestión-de-tickets)
4. [Base de Conocimientos](#4-base-de-conocimientos)
5. [Búsqueda Global](#5-búsqueda-global)
6. [Reportes y Análisis](#6-reportes-y-análisis)
7. [Gestión de Usuarios](#7-gestión-de-usuarios)
8. [Configuración del Sistema](#8-configuración-del-sistema)
9. [Sistema de Notificaciones](#9-sistema-de-notificaciones-por-email)
10. [Auto-Cierre de Tickets](#10-auto-cierre-de-tickets-por-el-cliente)
11. [Preferencias Personales](#11-preferencias-personales)

---

## 1. Inicio de Sesión

El sistema ofrece dos métodos de autenticación según el tipo de usuario:

### 1.1 Acceso para Personal Interno (Administradores/Equipo)
- **URL**: `/login`
- Ingrese email y contraseña
- **Credenciales por defecto**: `admin@multicomputos.com` / `123456`

### 1.2 Acceso para Clientes (Sin Contraseña - OTP)
Los clientes acceden mediante código de verificación:

**Paso 1:** Solicitar Código
1. Ingrese a `/portal/login`
2. Escriba su email autorizado
3. Click en "Enviar Código"
4. Revise su email (válido 10 minutos)

**Paso 2:** Verificar
1. Ingrese el código de 6 dígitos
2. Click en "Verificar y Entrar"

> **Nota:** Cada código solo puede usarse una vez y expira en 10 minutos.

---

## 2. Dashboard Principal
Panel de control con métricas en tiempo real:
- Tickets totales, abiertos, resueltos
- Tasa de resolución
- Tendencias (gráficas)
- Tickets recientes

---

## 3. Gestión de Tickets

### 3.1 Ver y Filtrar Tickets
- **Filtros**: Estado, prioridad, asignado
- **Búsqueda**: Por número, título o descripción
- **Ordenamiento**: Click en encabezados de columna

### 3.2 Crear Nuevo Ticket
1. Click en "Nuevo Ticket"
2. Complete formulario:
   - **Asunto**: Resumen breve
   - **Prioridad**: Baja/Media/Alta/Crítica
   - **Descripción**: Detalles completos
   - **CC (opcional)**: Emails para copias (separados por comas)
   - **Adjuntos (opcional)**: Máx. 10 imágenes, 10MB c/u, 20MB total
3. Click "Enviar Ticket"
4. **LAU responde automáticamente en 30 segundos**

### 3.3 Detalle del Ticket
- **Conversación**: Mensajes con el equipo
- **Adjuntos**: Imágenes subidas
- **Historial**: Cambios de estado registrados
- **Jerarquía de Asignación**:
  - Managers: Asignan a cualquier líder/oficial
  - Líderes: Solo asignan dentro de su departamento

---

## 4. Base de Conocimientos

### 4.1 Buscar Artículos (Clientes)
1. Acceda a `/portal/kb`
2. Use la barra de búsqueda
3. Navegue por categorías
4. Click en artículo para leer contenido completo

### 4.2 Gestionar Artículos (Administradores)
1. Acceda a `/admin/kb`
2. **Crear**: Click "Agregar Artículo"
   - Título
   - Categoría
   - Contenido (soporta Markdown)
   - ✅ "Publicar inmediatamente" o guardar como borrador
3. **Editar/Eliminar**: Botones en lista de artículos

---

## 5. Búsqueda Global

**Solo para Administradores/Equipo**

1. Use la barra de búsqueda superior (🔍)
2. Escribe mínimo 2 caracteres
3. Resultados agrupados:
   - **Tickets**: Número, título, descripción
   - **Usuarios**: Nombre, email
   - **Artículos KB**: Títulos
4. Máximo 5 resultados por categoría
5. Click en resultado para acceder directamente

---

## 6. Reportes y Análisis

**Solo para Managers y Team Leads**

### 6.1 Acceder a Reportes
Menú → Reports → Seleccionar período

### 6.2 Períodos Disponibles
- **7 Días**: Última semana
- **30 Días**: Último mes
- **90 Días**: Último trimestre
- **Todo**: Histórico completo

### 6.3 Métricas Visualizadas
- **Resumen**: Total, abiertos, resueltos, tasa de resolución
- **Tendencias**: Gráfica de tickets creados vs resueltos por día
- **Por Estado**: Distribución actual (OPEN, IN_PROGRESS, etc.)
- **Por Prioridad**: Desglose por severidad
- **Últimos Tickets**: Lista de 5 más recientes

### 6.4 Interpretación
- **Tasa de Resolución >80%**: Excelente
- **Picos en Tendencias**: Identificar días de alta demanda
- **CRITICAL acumulados**: Requieren atención inmediata

---

## 7. Gestión de Usuarios

**Solo para Managers**

### 7.1 Ver Usuarios
- Lista paginada (10 por página)
- Muestra: Nombre, email, rol, departamento

### 7.2 Crear Usuario
1. Click "Nuevo Usuario"
2. Complete:
   - Nombre completo
   - Email (único)
   - Rol: MANAGER, TEAM_LEAD, TECHNICIAN, etc.
   - Departamento
   - Contraseña inicial
3. Click "Guardar"

### 7.3 Editar/Eliminar
- **Editar**: Click en usuario → Modificar→ Guardar
- **Eliminar**: Click "Eliminar" → Confirmar

> **Importante:** No se puede eliminar usuario con tickets asignados.

---

## 8. Configuración del Sistema

**Solo para Managers**

Acceso: Menú → Settings

### 8.1 Configuración General
- **Nombre de la Empresa**: Aparece en emails y encabezados
- **Email de Soporte**: Receptor de alertas y notificaciones internas
- **Modo Mantenimiento**: Deshabilita acceso a no-administradores

### 8.2 Archivos
- **Tamaño Máximo (MB)**: Límite por archivo individual
- **Tipos Permitidos**: Extensiones separadas por comas (ej: `.jpg,.png,.pdf`)

### 8.3 Asistente Virtual LAU
- **Habilitar**: ✅ Activa/desactiva LAU
- **Nombre**: Personalizar nombre del asistente
- **Horario Laboral**: 
  - Hora Inicio (0-23)
  - Hora Fin (0-23)
  - LAU adapta mensajes según horario

### 8.4 Guardar Cambios
Click "Guardar Cambios" → Confirmación

---

## 9. Sistema de Notificaciones por Email 📧

### 9.1 Notificaciones Automáticas de LAU
- **Respuesta automática**: 30s después de crear ticket
- **Email enviado**: Con respuesta inicial de LAU
- **Análisis**: Sentimiento y prioridad ajustados

### 9.2 Notificaciones del Equipo
Recibirá email cuando:
- Miembro del equipo responde
- Cambia el estado del ticket
- Se asigna/reasigna el ticket

### 9.3 Sistema de Copias (CC)
Al crear ticket:
1. Campo "Enviar Copia a (CC)"
2. Ingrese emails separados por comas
3. Todos los CCs reciben:
   - Creación del ticket
   - Respuestas de LAU
   - Mensajes del equipo
   - Cambios de estado
   - Cierre

**Casos de uso:**
- Supervisor
- Múltiples departamentos
- Colaboradores externos

---

## 10. Auto-Cierre de Tickets por el Cliente 🎯

### 10.1 Cuándo Puedo Cerrar
Cuando estado = **"Esperando Cliente"** (WAITING_CUSTOMER)

**Opciones:**
- **A**: Cerrar si problema resuelto
- **B**: Responder → ticket se reabre automáticamente

### 10.2 Cerrar desde Portal
1. Ingrese al ticket
2. Verá card azul destacada
3. Click "✅ Cerrar Ticket"
4. Estado cambia a "Resuelto"

### 10.3 Cerrar desde Email
1. Reciba email con estado WAITING_CUSTOMER
2. Click botón azul "✅ Cerrar Ticket"
3. Redirige al portal con confirmación

### 10.4 Auto-Reapertura
Si responde estando en WAITING_CUSTOMER:
- Sistema cambia automáticamente a "En Progreso"
- Equipo recibe notificación
- Sin pasos manuales adicionales

---

## 11. Preferencias Personales

### 11.1 Idioma
- Selector en parte superior (🌐)
- Español / English
- Todo el sitio cambia instantáneamente

### 11.2 Modo Oscuro
- Botón de tema (☀️/🌙) en barra superior
- Claro / Oscuro / Sistema
- Preferencia guardada automáticamente

### 11.3 Actualizar Perfil
1. Click en nombre de usuario
2. Seleccione "Settings"
3. Modifique nombre/contraseña
4. Click "Guardar"

---

*Generado automáticamente por MC Support Agent.*  
*Última actualización: Diciembre 2025*  
*Versión: 2.0.0*
