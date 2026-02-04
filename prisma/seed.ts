import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  // Departamentos - 7 departamentos en Inglés (sin Aplicaciones)
  const deptApplication = await prisma.department.upsert({
    where: { name: "Application" },
    update: {},
    create: { name: "Application" },
  });
  const deptSupport = await prisma.department.upsert({
    where: { name: "Support" },
    update: {},
    create: { name: "Support" },
  });
  const deptDev = await prisma.department.upsert({
    where: { name: "Development" },
    update: {},
    create: { name: "Development" },
  });
  const deptConsulting = await prisma.department.upsert({
    where: { name: "Consulting" },
    update: {},
    create: { name: "Consulting" },
  });
  const deptService = await prisma.department.upsert({
    where: { name: "Service" },
    update: {},
    create: { name: "Service" },
  });
  const deptInfra = await prisma.department.upsert({
    where: { name: "Infrastructure" },
    update: {},
    create: { name: "Infrastructure" },
  });
  const deptNetworks = await prisma.department.upsert({
    where: { name: "Networks" },
    update: {},
    create: { name: "Networks" },
  });
  const deptAccounting = await prisma.department.upsert({
    where: { name: "Accounting" },
    update: {},
    create: { name: "Accounting" },
  });

  const passwordHash = await hash("123456", 10);

  // Semilla de Roles
  // Asistente Virtual
  const assistant = await prisma.user.upsert({
    where: { email: "assistant@multicomputos.com" },
    update: {
      role: "VIRTUAL_ASSISTANT",
      departmentId: deptApplication.id,
      password: passwordHash,
    },
    create: {
      email: "assistant@multicomputos.com",
      name: "LAU (Virtual Assistant)",
      password: passwordHash,
      role: "VIRTUAL_ASSISTANT",
      departmentId: deptApplication.id,
    },
  });

  // Administrador - asignado a Aplicaciones (departamento principal para supervisión)
  const admin = await prisma.user.upsert({
    where: { email: "admin@multicomputos.com" },
    update: {
      role: "ADMIN",
      departmentId: deptApplication.id,
      password: passwordHash,
    },
    create: {
      email: "admin@multicomputos.com",
      name: "Admin System",
      password: passwordHash,
      role: "ADMIN",
      departmentId: deptApplication.id,
    },
  });

  const root = await prisma.user.upsert({
    where: { email: "ing.multicomputos@gmail.com" },
    update: {
      role: "ROOT",
      departmentId: deptApplication.id,
      password: passwordHash,
    },
    create: {
      email: "ing.multicomputos@gmail.com",
      name: "Admin System",
      password: passwordHash,
      role: "ROOT",
      departmentId: deptApplication.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "michael.albert@multicomputos.com" },
    update: {
      role: "MANAGER",
      departmentId: deptApplication.id,
      password: passwordHash,
    },
    create: {
      email: "michael.albert@multicomputos.com",
      name: "Michael Albert (Manager)",
      password: passwordHash,
      role: "MANAGER",
      departmentId: deptApplication.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "claudia.pontier@multicomputos.com" },
    update: {
      role: "SERVICE_OFFICER",
      departmentId: deptService.id,
      password: passwordHash,
    },
    create: {
      email: "claudia.pontier@multicomputos.com",
      name: "Claudia Perez (Oficial de Servicio)",
      password: passwordHash,
      role: "SERVICE_OFFICER",
      departmentId: deptService.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "fleirin.cipion@multicomputos.com" },
    update: {
      role: "TEAM_LEAD",
      departmentId: deptDev.id,
      password: passwordHash,
    },
    create: {
      email: "fleirin.cipion@multicomputos.com",
      name: "Fleirin Cipion (Lider de equipo)",
      password: passwordHash,
      role: "TEAM_LEAD",
      departmentId: deptDev.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "jose.bobadilla@multicomputos.com" },
    update: {
      role: "TEAM_LEAD",
      departmentId: deptConsulting.id,
      password: passwordHash,
    },
    create: {
      email: "jose.bobadilla@multicomputos.com",
      name: "Jose Bobadilla (Lider de equipo)",
      password: passwordHash,
      role: "TEAM_LEAD",
      departmentId: deptConsulting.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "elizardo.cuello@multicomputos.com" },
    update: {
      role: "TECHNICAL_LEAD",
      departmentId: deptNetworks.id,
      password: passwordHash,
    },
    create: {
      email: "elizardo.cuello@multicomputos.com",
      name: "Elizardo Cuello (Líder Técnico)",
      password: passwordHash,
      role: "TECHNICAL_LEAD",
      departmentId: deptNetworks.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "luis.vargas@multicomputos.com" },
    update: {
      role: "CONSULTANT",
      departmentId: deptConsulting.id,
      password: passwordHash,
    },
    create: {
      email: "luis.vargas@multicomputos.com",
      name: "Luis Vargas (Consultor Netsuite)",
      password: passwordHash,
      role: "CONSULTANT",
      departmentId: deptConsulting.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "eric.collado@multicomputos.com" },
    update: {
      role: "DEVELOPER",
      departmentId: deptDev.id,
      password: passwordHash,
    },
    create: {
      email: "eric.collado@multicomputos.com",
      name: "Eric Collado (Desarrollador Junior)",
      password: passwordHash,
      role: "DEVELOPER",
      departmentId: deptDev.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "laura.lopez@multicomputos.com" },
    update: {
      role: "CONSULTANT",
      departmentId: deptConsulting.id,
      password: passwordHash,
    },
    create: {
      email: "laura.lopez@multicomputos.com",
      name: "Laura Lopez (Consultora Junior)",
      password: passwordHash,
      role: "CONSULTANT",
      departmentId: deptConsulting.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "heri.espinosa@multicomputos.com" },
    update: {
      role: "TECHNICAL_LEAD",
      departmentId: deptDev.id,
      password: passwordHash,
    },
    create: {
      email: "heri.espinosa@multicomputos.com",
      name: "Heri Espinosa (Líder de Desarrolladores y Automatizaciones)",
      password: passwordHash,
      role: "TECHNICAL_LEAD",
      departmentId: deptDev.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "enmanuel.santos@multicomputos.com" },
    update: {
      role: "TECHNICIAN",
      departmentId: deptNetworks.id,
      password: passwordHash,
    },
    create: {
      email: "enmanuel.santos@multicomputos.com",
      name: "Enmanuel Santos (Redes)",
      password: passwordHash,
      role: "TECHNICIAN",
      departmentId: deptNetworks.id,
    },
  });

  // Asignar variable 'user' para creación de tickets
  const user = admin;
  console.log("Seeded Users: admin, lider, tech, dev @multicomputos.com");

  // --- SEMILLA DE CLIENTES ---
  const clientHidalgos = await prisma.user.upsert({
    where: { email: "ing.espinosareyes@gmail.com" },
    update: { role: "CLIENT", password: passwordHash },
    create: {
      email: "ing.espinosareyes@gmail.com",
      name: "Farmacia Los Hidalgos (Cliente)",
      password: passwordHash,
      role: "CLIENT",
    },
  });

  const clientRamos = await prisma.user.upsert({
    where: { email: "espinosa_reyes@hotmail.com" },
    update: { role: "CLIENT", password: passwordHash },
    create: {
      email: "espinosa_reyes@hotmail.com",
      name: "Grupo Ramos (Cliente)",
      password: passwordHash,
      role: "CLIENT",
    },
  });

  const clientBPD = await prisma.user.upsert({
    where: { email: "invicto230895@gmail.com" },
    update: { role: "CLIENT", password: passwordHash },
    create: {
      email: "invicto230895@gmail.com",
      name: "Banco Popular (Cliente)",
      password: passwordHash,
      role: "CLIENT",
    },
  });

  console.log("Seeded Clients: Hidalgos, Ramos, BPD");

  // Crear Tickets de Ejemplo
  // Verificar si existen tickets para evitar duplicación al re-ejecutar...
  // Por simplicidad, solo los creamos.
  // Dado que la ejecución anterior pudo fallar o tener éxito a medias, solo contamos.

  const count = await prisma.case.count();
  if (count === 0) {
    await prisma.case.createMany({
      data: [
        // Factura Electrónica
        {
          title: "Error envío DGII XML - Factura Electrónica",
          description:
            "Al intentar enviar el lote de facturas de ayer, recibimos un error 500 del servicio de la DGII. El XML parece estar mal formado según el log.",
          priority: "CRITICAL",
          status: "OPEN",
          userId: clientHidalgos.id,
          ticketNumber: "FE-001",
        },
        {
          title: "Configuración secuencia NCF B01",
          description:
            "Necesitamos asistencia para configurar la nueva secuencia de Comprobantes Fiscales (B01) que vence el próximo mes.",
          priority: "MEDIUM",
          status: "IN_PROGRESS",
          userId: clientRamos.id,
          ticketNumber: "FE-002",
        },

        // Implementaciones ERP Netsuite
        {
          title: "Error en Workflow de Aprobación de Compras",
          description:
            "El flujo de aprobación se detiene cuando el monto supera los 50,000 DOP. El supervisor no recibe la notificación.",
          priority: "HIGH",
          status: "OPEN",
          userId: clientBPD.id,
          ticketNumber: "NS-IMP-001",
        },
        {
          title: "Duda sobre reporte de Inventario por Ubicación",
          description:
            "El reporte nativo no muestra stock en tránsito. ¿Cómo podemos personalizarlo?",
          priority: "LOW",
          status: "WAITING_CUSTOMER",
          userId: clientHidalgos.id,
          ticketNumber: "NS-IMP-002",
        },

        // Desarrollo de Aplicaciones
        {
          title: "Bug en integración API Shopify",
          description:
            "Las órdenes creadas en Shopify no están cayendo en el ERP si el cliente tiene caracteres especiales en el nombre.",
          priority: "HIGH",
          status: "IN_PROGRESS",
          userId: user.id, // Internal test
          ticketNumber: "DEV-001",
        },
        {
          title: "Nueva funcionalidad Portal Clientes",
          description:
            "Requerimiento para agregar botón de descarga de estados de cuenta en PDF.",
          priority: "MEDIUM",
          status: "OPEN",
          userId: clientRamos.id,
          ticketNumber: "DEV-002",
        },

        // Consultorías
        {
          title: "Optimización de procesos de cierre fiscal",
          description:
            "Consultoría solicitada para revisar los tiempos de cierre mensual, actualmente toman 10 días.",
          priority: "LOW",
          status: "RESOLVED",
          userId: clientBPD.id,
          ticketNumber: "CONS-001",
        },
        {
          title: "Auditoría de permisos de usuario",
          description:
            "Revisión trimestral de accesos y roles en el sistema ERP.",
          priority: "MEDIUM",
          status: "OPEN",
          userId: clientRamos.id,
          ticketNumber: "CONS-002",
        },

        // Seeds originales adaptados
        {
          title: "Fallo integración Legacy System",
          description: "El sistema legado no responde al ping.",
          priority: "CRITICAL",
          status: "CLOSED",
          userId: user.id,
          ticketNumber: "LEG-001",
        },
      ],
    });
    console.log("Seeded sample tickets.");
  } else {
    console.log("Tickets already exist, skipping.");
  }

  // Crear Categorías (todas en Inglés internamente, traducciones manejadas en UI)
  const categoryBilling = await prisma.category.upsert({
    where: { slug: "billing" },
    update: { name: "Billing" },
    create: {
      name: "Billing",
      slug: "billing",
      description: "Invoices, payments and electronic invoicing",
    },
  });

  await prisma.category.createMany({
    data: [
      { name: "General", slug: "general", description: "General questions" },
      {
        name: "Technical",
        slug: "technical",
        description: "Technical support",
      },
      {
        name: "NetSuite",
        slug: "netsuite",
        description: "NetSuite ERP related articles",
      },
      {
        name: "Artificial Intelligence",
        slug: "artificial-intelligence",
        description: "AI and machine learning",
      },
      {
        name: "Software Development",
        slug: "software-development",
        description: "Programming and development",
      },
      {
        name: "Human Resources",
        slug: "human-resources",
        description: "HR and personnel management",
      },
      {
        name: "Marketing",
        slug: "marketing",
        description: "Marketing and advertising",
      },
      {
        name: "Database",
        slug: "database",
        description: "Database management and SQL",
      },
      {
        name: "Information Technology",
        slug: "information-technology",
        description: "IT infrastructure and systems",
      },
      {
        name: "Accounting",
        slug: "accounting",
        description: "Accounting and finance",
      },
      {
        name: "Business Management",
        slug: "business-management",
        description: "Business operations and management",
      },
      {
        name: "Security",
        slug: "security",
        description: "Cybersecurity and data protection",
      },
    ],
    skipDuplicates: true,
  });

  // Crear categoría MCSupport para documentación
  const categoryMCSupport = await prisma.category.upsert({
    where: { slug: "mcsupport" },
    update: { name: "MCSupport" },
    create: {
      name: "MCSupport",
      slug: "mcsupport",
      description: "Everything about MCSupport system",
    },
  });

  // Crear Artículo de Base de Conocimiento - Factura Electrónica RD
  const articleContent = `# Factura Electrónica en República Dominicana

## Guía Completa del Sistema de Comprobantes Fiscales Electrónicos (e-CF)

## 1. Introducción

La **factura electrónica** en República Dominicana, conocida oficialmente como **Comprobante Fiscal Electrónico (e-CF)**, es un documento digital firmado electrónicamente que certifica la transferencia de bienes, la entrega en uso o la prestación de servicios entre partes comerciales. Este sistema reemplaza las facturas tradicionales en papel y está regulado por la **Dirección General de Impuestos Internos (DGII)**.

### 1.1 Marco Legal

El sistema de facturación electrónica se rige por:

- **Ley No. 32-23** de Facturación Electrónica (promulgada el 16 de mayo de 2023)
- **Decreto 587-24** - Reglamento de aplicación de la Ley 32-23
- **Norma General 01-2020** - Regula la emisión y uso de los e-CF
- Normativas y resoluciones complementarias emitidas por la DGII

---

## 2. Beneficios de la Facturación Electrónica

### Para Contribuyentes

| Beneficio | Descripción |
|-----------|-------------|
| **Reducción de Costos** | Eliminación de gastos de impresión, almacenamiento físico y mensajería |
| **Mayor Eficiencia** | Automatización de procesos administrativos y reducción de carga manual |
| **Menos Errores** | Al ser digital, se reduce significativamente la probabilidad de errores |
| **Seguridad** | Documentos firmados digitalmente que garantizan autenticidad e integridad |
| **Simplificación Tributaria** | Los emisores electrónicos NO deben presentar reportes 607 y 608 |
| **Crédito Fiscal Validado** | Mayor validez del crédito fiscal entre empresas |
| **Gestión Contable Ágil** | Facilita auditorías y preparación de declaraciones |
| **Impacto Ambiental** | Contribución al medio ambiente por reducción de papel |

### Para la Administración Tributaria

- Control fiscal en tiempo real
- Reducción de la evasión fiscal
- Datos estadísticos más precisos
- Facilitación de procesos de auditoría

---

## 3. Tipos de Comprobantes Fiscales Electrónicos

| Tipo | Código | Descripción | Uso Principal |
|------|--------|-------------|---------------|
| Factura de Crédito Fiscal Electrónica | E31 | Transacciones B2B | Sustentar gastos, costos o crédito fiscal |
| Factura de Consumo Electrónica | E32 | Ventas a consumidores finales | Comercio minorista |
| Nota de Débito Electrónica | E33 | Recuperar costos adicionales | Intereses, fletes, recargos |
| Nota de Crédito Electrónica | E34 | Modificar condiciones de venta | Anulaciones, devoluciones, descuentos |
| Comprobante Electrónico de Compras | E41 | Compras a no contribuyentes | Adquisiciones informales |
| Comprobante para Gastos Menores | E43 | Gastos laborales | Viáticos, gastos de representación |
| Comprobante para Regímenes Especiales | E44 | Regímenes fiscales especiales | Zonas francas, exenciones |
| Comprobante Gubernamental | E45 | Transacciones gubernamentales | Ventas al Estado |
| Comprobante de Exportaciones | E46 | Ventas internacionales | Exportaciones de bienes |
| Comprobante para Pagos al Exterior | E47 | Pagos internacionales | Servicios del exterior |

---

## 4. Estructura del e-NCF

El **Número de Comprobante Fiscal Electrónico (e-NCF)** es una secuencia alfanumérica de **13 caracteres** otorgada por la DGII:

| Posición | Contenido | Ejemplo |
|----------|-----------|---------|
| 1 | Letra "E" (serie electrónica) | E |
| 2-3 | Tipo de comprobante | 31 |
| 4-13 | Número secuencial | 0000000001 |

**Ejemplo completo:** E310000000001 (Factura de Crédito Fiscal #1)

---

## 5. Requisitos para Ser Emisor Electrónico

Para emitir e-CF, los contribuyentes deben cumplir:

1. Estar inscrito en el **Registro Nacional de Contribuyentes (RNC)**
2. Estar **al día** con obligaciones tributarias y deberes formales
3. Poseer autorización para emitir Comprobantes Fiscales (**Alta NCF**)
4. Tener acceso a la **Oficina Virtual (OFV)** de la DGII
5. Contar con un **certificado digital válido** para procedimientos tributarios
6. Disponer de **software para emisión de e-CF** que cumpla estándares DGII
7. Aprobar el **proceso de certificación** establecido por la DGII

### Opciones de Software

| Opción | Descripción | Requisitos |
|--------|-------------|------------|
| **Desarrollo Propio** | Sistema interno certificado | Mayor inversión, control total |
| **Proveedor Certificado** | Servicio de terceros autorizados | Menor inversión inicial |
| **Facturador Gratuito DGII** | Software gratuito de la DGII | Hasta 150 facturas mensuales |

---

## 6. Proceso de Certificación

El proceso para convertirse en emisor electrónico consta de tres etapas:

### Etapa 1: Solicitud (1-10 días)
- Completar **Formulario FI-GDF-016** en la Oficina Virtual
- Validación de requisitos por la DGII
- Recepción de credenciales del portal de certificación

### Etapa 2: Set de Pruebas (~10 días)
- Pruebas de transmisión de e-CF
- Validación de estructura XML
- Verificación de firma digital
- Pruebas de acuse de recibo y aprobación comercial
- Generación de representación impresa (RI)

### Etapa 3: Certificación
- Aprobación de todas las pruebas
- Presentación de declaración jurada
- Habilitación del menú de Facturación Electrónica en OFV
- Autorización para solicitar e-NCF y comenzar emisión

---

## 7. Estados de Validación del e-CF

Al enviar un e-CF, la DGII responde con uno de estos estados:

| Estado | Significado | Acción Requerida |
|--------|-------------|------------------|
| **e-CF Aceptado** | Documento válido y registrado | Ninguna |
| **e-CF Aceptado Condicional** | Aceptado con observaciones menores | Revisar observaciones |
| **e-CF Rechazado** | No cumple requisitos | Corregir y reenviar |
| **e-CF En Proceso** | En cola de validación | Esperar respuesta |

---

## 8. Calendario de Implementación Obligatoria

| Tipo de Contribuyente | Plazo desde Ley 32-23 | Fecha Límite | Estado |
|-----------------------|-----------------------|--------------|--------|
| Grandes Contribuyentes Nacionales | 12 meses | 15 mayo 2024 | Completado |
| Grandes Contribuyentes Locales | 24 meses | 15 noviembre 2025* | En proceso |
| Medianos Contribuyentes | 24 meses | 15 noviembre 2025* | En proceso |
| Pequeños Contribuyentes | 36 meses | 15 mayo 2026 | Pendiente |
| Micro y No Clasificados | 36 meses | 15 mayo 2026 | Pendiente |

*Prórroga de 6 meses otorgada para contribuyentes en proceso de adopción.

---

## 9. Especificaciones Técnicas

### Formato del Documento
- **Estructura:** XML (eXtensible Markup Language)
- **Codificación:** UTF-8
- **Firma Digital:** XMLDSig con certificado autorizado
- **Comunicación:** Web Services (SOAP/REST)
- **Validación:** Tiempo real mediante servicios de la DGII

### Componentes del e-CF
1. **Encabezado:** Datos del emisor, comprador, información tributaria
2. **Detalle:** Bienes o servicios facturados
3. **Totales:** Montos, impuestos, descuentos
4. **Firma Digital:** Garantiza autenticidad e integridad

---

## 10. Sanciones por Incumplimiento

Según el **Artículo 26 de la Ley 32-23**, el incumplimiento puede resultar en:

| Tipo de Sanción | Descripción |
|-----------------|-------------|
| **Multas** | Penalizaciones pecuniarias según gravedad |
| **Inhabilitación** | Suspensión temporal de emisión de NCF |
| **Invalidez Fiscal** | Facturas fuera del sistema NO tendrán validez fiscal |
| **Pérdida de Crédito** | Imposibilidad de sustentar gastos o crédito ITBIS |

---

## 11. Preguntas Frecuentes

### ¿Puedo seguir usando facturas en papel?
Después de su fecha límite obligatoria, **solo serán válidas las facturas electrónicas**. Las facturas en papel no tendrán validez fiscal.

### ¿Qué pasa si mi cliente no es emisor electrónico?
Puede emitir e-CF a cualquier contribuyente con RNC. El receptor puede consultar el documento en la Oficina Virtual de la DGII.

### ¿Cuánto tiempo debo conservar los e-CF?
Los e-CF deben conservarse por **10 años** según el Código Tributario.

### ¿Puedo usar el Facturador Gratuito de la DGII?
Sí, si emite hasta 150 facturas mensuales y está al día con sus obligaciones tributarias.

### ¿Qué certificado digital necesito?
Un certificado digital para Procedimientos Tributarios emitido por una Prestadora de Servicios de Confianza autorizada.

---

## 12. Recursos Oficiales

| Recurso | Enlace |
|---------|--------|
| Portal DGII | dgii.gov.do |
| Oficina Virtual | ofv.dgii.gov.do |
| Documentación Técnica | dgii.gov.do/facturacionElectronica |
| Ley 32-23 | Consulta Legal DGII |
| Decreto 587-24 | Reglamento de Aplicación |
| Norma General 01-2020 | Normativa e-CF |

---

## 13. Contacto y Soporte

Para asistencia con facturación electrónica:

- **Centro de Atención DGII:** 809-689-3444
- **Correo:** info@dgii.gov.do
- **Oficina Virtual:** Sección de Facturación Electrónica
- **Presencial:** Administraciones Locales DGII

*Documento actualizado: Diciembre 2024*
*Fuente: Dirección General de Impuestos Internos (DGII)*`;

  await prisma.article.upsert({
    where: { slug: "factura-electronica-republica-dominicana" },
    update: {
      title: "Factura Electrónica en República Dominicana",
      content: articleContent,
      isPublished: true,
    },
    create: {
      title: "Factura Electrónica en República Dominicana",
      slug: "factura-electronica-republica-dominicana",
      content: articleContent,
      isPublished: true,
      categoryId: categoryBilling.id,
      authorId: admin.id,
    },
  });

  console.log("Seeded knowledge base article: Factura Electrónica RD");

  const mcSupportArticles = [
    // --- MANUAL CLIENTE ---
    {
      title: "Cómo usar el Modo Vacaciones",
      slug: "como-usar-modo-vacaciones",
      content: `# Modo Vacaciones 🌴

El **Modo Vacaciones** permite a los agentes pausar su asignación automática de tickets durante ausencias.

## Activación

1. Vaya a **Settings** > **System Configuration**.
2. Busque la sección **Vacation Mode**.
3. Seleccione la **Fecha de Inicio** y **Fecha de Fin**.
   - *Nota*: El calendario se cerrará automáticamente al seleccionar un día.
4. (Opcional) Escriba un mensaje de autorespuesta.
5. Pulse **Activate**.

## Desactivación

El modo se desactivará automáticamente al llegar la fecha fin, o puede pulsar **Deactivate** manualmente.`,
    },
    {
      title: "Guía del Portal de Cliente",
      slug: "guia-portal-cliente",
      content: `# Manual del Cliente: Portal de Autoservicio 🌟

**Bienvenido al Centro de Soporte de Multicomputos.**

Esta guía describe cada funcionalidad del portal, diseñada para ser intuitiva y rápida.

---

## 1. 🔍 Navegación Principal (Dashboard)

Al iniciar sesión, verá el Panel Principal con 3 secciones clave:

### A. Buscador Global

- Ubicado en la parte superior.
- Escriba aquí sus dudas (ej. _"Cómo desbloquear usuario"_).
- El sistema buscará respuestas instantáneas en nuestra **Base de Conocimiento** para evitarle tener que crear un ticket.

### B. Barra Superior (Personalización)

En la esquina superior derecha encontrará los controles de preferencia:

- 🌐 **Idioma**: Cambie instantáneamente entre Inglés (EN) y Español (ES).
- 🌗 **Tema**: Alterne entre Modo Claro (Día) y Modo Oscuro (Noche) para mayor comodidad visual.
- 👤 **Usuario**: Acceso a configuración y cierre de sesión.

### C. Accesos Rápidos (Tarjetas)

1.  **Nueva Solicitud**: Botón directo para reportar un incidente.
2.  **Mis Tickets**: Acceso a su historial de casos abiertos y cerrados.
3.  **Base de Conocimiento**: Biblioteca de manuales y guías de autoayuda.

---

## 2. 📝 Nueva Solicitud (Ticket)

Al pulsar "Crear Solicitud", completará un formulario inteligente:

- **Asunto**: Título breve.
- **Prioridad**: Indica la urgencia (Baja, Media, Alta, Crítica).
- **Descripción**: Explique el problema detalladamente.
- **CC Emails**: Agregue correos de colegas (separados por comas) para mantenerlos informados.
- **Adjuntos**:
  - Máximo **10 archivos**.
  - Máximo **10MB** por archivo (30MB total).
  - El sistema comprime automáticamente las imágenes grandes.

---

## 3. 📜 Mis Tickets (Historial)

En la sección "Ver Historial", encontrará una tabla con todos sus casos:

**Columnas:**

- **Detalles**: ID único del ticket (ej. **#TKT-8291**).
- **Asunto**: Título del reporte.
- **Prioridad**: Importancia asignada.
- **Estado**:
  - 🔵 **OPEN**: Recibido.
  - 🟠 **IN_PROGRESS**: Un técnico está trabajando.
  - 🟣 **WAITING_CUSTOMER**: Requerimos su respuesta.
  - 🟢 **RESOLVED**: Solucionado.
- **Acciones**: Botón "Ver Historial" para entrar al detalle.

**Dentro del Ticket:**

- Verá el chat completo con el agente.
- Puede responder mensajes y agregar nuevos archivos.
- Puede marcar el ticket como resuelto si está conforme.

### ✅ Resolución y Encuesta

Cuando un agente soluciona su problema, el ticket pasará a estado **Resuelto (RESOLVED)**.

1.  **Confirmación**: Recibirá un correo notificándole la solución.
2.  **Cierre Automático**: Si no contesta en **24 horas**, el sistema cerrará el ticket automáticamente.
3.  **Encuesta de Satisfacción**: Al cerrarse el ticket (manual o automáticamente), recibirá un enlace para **calificar el servicio** (1 a 5 estrellas) y dejar comentarios. ¡Su opinión nos ayuda a mejorar!

---

## 4. 📚 Base de Conocimiento (KB)

Aquí almacenamos la sabiduría acumulada de Multicomputos.

- **Buscador Inteligente**: Filtra artículos mientras escribe.
- **Categorías**: Navegue por temas (ej. _Facturación_, _Conectividad_, _NetSuite_).
- **Artículos**: Guías paso a paso con imágenes y videos.

---

## 5. ⚙️ Configuración y Perfil

En el menú superior derecho -> **Configuración**:

### Pestaña Perfil

- Actualice su Nombre y Preferencias.

### Pestaña Seguridad (2FA)

Para proteger su cuenta, puede activar la **Autenticación de Dos Factores**:

1.  Escanee el código QR con Google Authenticator o Microsoft Authenticator.
2.  Ingrese el código de 6 dígitos para confirmar.

- _Nota: Esto añada una capa extra de seguridad al login._

_© 2025 Multicomputos Support Team_`,
    },

    // --- MANUAL OPERATIVO (DIVIDIDO) ---
    {
      title: "Manual Operativo: Navegación y Dashboard",
      slug: "manual-operativo-navegacion",
      isInternal: true,
      content: `# Manual Operativo: Navegación y Dashboard

**Audiencia:** Gerentes, Técnicos y Operativos.

## 🔭 Navegación Superior (Top Bar)

La barra superior contiene herramientas globales accesibles desde cualquier pantalla:

1.  **Buscador Global**: (Ctrl+K) Permite buscar tickets, usuarios o artículos KB desde cualquier lugar.
2.  🌐 **Selector de Idioma**: Cambie la interfaz entre Inglés y Español. Las notificaciones automáticas también respetarán esta preferencia.
3.  🌗 **Selector de Tema**:
    - _Light_: Fondo blanco, estándar para oficinas iluminadas.
    - _Dark_: Fondo oscuro, ideal para reducir fatiga visual en turnos nocturnos.
    - _System_: Se adapta a la configuración de su sistema operativo.
4.  👤 **Menú de Usuario**: Acceso rápido a Logout y Configuración Personal.

---

## 1. 🏁 Panel de Control (Dashboard)

**Ruta**: **/admin**
**Componente**: **AdminPage** + **DashboardStats**

El dashboard ofrece una vista táctica de alto nivel. Los datos se refrescan cada 5 minutos.

### Tarjetas de Métricas (KPIs)

1.  **Total Tickets**: Volumen histórico acumulado. Crecimiento vs mes anterior.
2.  **Open Cases**: Tickets en estado **OPEN** o **IN_PROGRESS**.
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

**Ruta**: **/admin/dashboard/my-work**
**Lógica**: Filtro implícito sobre la vista de Tickets.

Esta vista está diseñada para la ejecución. A diferencia de la lista general, esta vista aplica una lógica de ordenamiento forzado:

1.  **Filtro**: Solo muestra tickets donde **assignedToId** == Su Usuario.
2.  **Orden**: Ascendente por **slaTargetAt**.
    - Los tickets próximos a vencer (o ya vencidos) aparecen SIEMPRE arriba.
    - No se puede cambiar el orden de esta lista; está diseñada para evitar cherry-picking.`,
    },
    {
      title: "Manual Operativo: Gestión de Tickets",
      slug: "manual-operativo-tickets",
      isInternal: true,
      content: `# Manual Operativo: Gestión de Tickets

**Ruta**: **/admin/tickets**

### Barra de Herramientas

- **Buscador**: Búsqueda "fuzzy" insensible a mayúsculas. Busca en: Título, Número de Ticket, Nombre de Cliente.
- **Filtro Departamento**: Lista desplegable dinámica basada en los departamentos activos.
- **Filtro Asignado**: Permite ver la carga de un compañero específico o buscar tickets sin asignar ("Unassigned").

### Tabla de Datos

Columnas interactivas (Click para ordenar):

- **Ticket #**: ID único.
- **Title**: Asunto cortado si es muy largo.
- **Customer**: Nombre y Email.
- **Priority**: Badge (Low, Medium, High, Critical).
- **Status**: Badge de estado.
- **Category**: Clasificación dada por LAU.
- **Assignee**: Agente responsable.
- **Date**: Fecha de creación (DD-MM-YYYY HH:mm).

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
  - _Nota_: Si el estado es **WAITING_CUSTOMER**, el reloj SLA se **pausa** automáticamente.
- **Acciones Rápidas**:
  - _Take it_: Asignarse el ticket a uno mismo.
  - _Change Status_: Desplegable de transición de estados.
- **Pestañas**:
  - _Conversation_: Hilo de correos.
    - **Notas Internas**: Los agentes pueden marcar "Nota Interna (Privada)" al enviar un mensaje. Estos mensajes aparecen en amarillo y **NO son visibles para el cliente**.
  - _Files_: Galería de adjuntos.

### Flujo de Resolución

1.  **Resolver**: Al marcar un ticket como **RESOLVED**, el cliente recibe una notificación.
2.  **Auto-Finalización**: Un cron job verifica tickets resueltos hace **más de 24 horas**. Si el cliente no ha interactuado, se cierra automáticamente (**CLOSED**).
3.  **Encuesta**: Al cerrarse, se envía automáticamente una encuesta al cliente. El resultado se vincula al agente que resolvió el caso.`,
    },
    {
      title: "Manual Operativo: Base de Conocimiento (KB)",
      slug: "manual-operativo-kb",
      isInternal: true,
      content: `# Manual Operativo: Base de Conocimiento (KB)

**Ruta**: **/admin/kb**

### Flujo de Publicación

1.  **Borrador (Draft)**: Estado inicial. Solo visible para agentes.
2.  **Publicado (Published)**: Visible para clientes en el Portal y sugereible por LAU.

### Editor

- Soporta formato **Markdown** básico.
- **Categoría**: Obligatoria. Se usa para el algoritmo de coincidencia de LAU. Antes de crear un artículo, asegúrese de que la categoría exista.`,
    },
    {
      title: "Manual Operativo: Reportes y Métricas",
      slug: "manual-operativo-reportes",
      isInternal: true,
      content: `# Manual Operativo: Reportes (Analytics)

**Ruta**: **/admin/reports**

Este módulo procesa métricas en tiempo real.

### Filtros de Tiempo

Selector de rango preciso:

- **Last 7 days** (Semanal)
- **Last 30 days** (Mensual)
- **Last 90 days** (Trimestral)
- **Last 180 days** (Semestral)
- **Last 365 days** (Anual)
- **All Time** (Histórico completo)

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

- Botón **Drowndown "Download"**: Permite descargar un CSV crudo con los datos del periodo seleccionado.`,
    },
    {
      title: "Manual Operativo: Gestión de Usuarios",
      slug: "manual-operativo-usuarios",
      isInternal: true,
      content: `# Manual Operativo: Usuarios

**Ruta**: **/admin/users**
**(Rol Requerido: MANAGER)**

### Formulario de Usuario

Campos obligatorios al crear/editar:

- **Name**
- **Email**
- **Role**: Manager, Team Lead, Technician, Consultant, Developer, Service Officer, Client.
- **Department**: (Requerido si el rol es técnico).
- **Skills**: Etiquetas de habilidades (ej. "Netsuite", "Infrastructure") usadas para la auto-asignación inteligente.`,
    },
    {
      title: "Manual Operativo: Configuración del Sistema",
      slug: "manual-operativo-configuracion",
      isInternal: true,
      content: `# Manual Operativo: Configuración

**Ruta**: **/admin/settings**

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
    - Definición de hora inicio/fin y días laborales. Afecta el cálculo de fechas de vencimiento.`,
    },

    // --- ARTÍCULOS EXISTENTES (PRESERVADOS) ---
    {
      title: "Asistente Virtual LAU",
      slug: "asistente-virtual-lau",
      content: `# Asistente Virtual LAU 🤖

## ¿Qué es LAU?

LAU es el Asistente Virtual inteligente de MCSupport que automatiza la atención inicial de tickets.

---

## Capacidades de LAU

| Capacidad | Descripción |
|-----------|-------------|
| 🌍 **Bilingüe** | Detecta idioma y responde en español o inglés |
| 🏷️ **Clasificación** | Categoriza tickets automáticamente |
| 🎯 **Auto-Asignación** | Asigna al departamento correcto |
| 📚 **Respuestas KB** | Si encuentra artículo relevante, responde con información |
| ⏰ **Seguimiento** | Recordatorios a 48h, advertencia a 6 días, cierre a 7 días |
| 🚨 **Escalado** | Alerta automática para tickets críticos o sentimiento negativo |

---

## Seguimiento Automático

LAU mantiene informados a todos los involucrados:

- **48 horas sin respuesta**: Recordatorio amigable
- **6 días sin respuesta**: Advertencia de cierre próximo
- **7 días sin respuesta**: Cierre automático del ticket

> Si el cliente responde antes del cierre, el ticket se mantiene abierto.

---

## Configuración

**Solo Managers** pueden configurar LAU:

1. Menú → **Settings**
2. Sección **Asistente Virtual**
3. Opciones:
   - Habilitar/Deshabilitar
   - Nombre del asistente
   - Horario laboral (LAU adapta mensajes según hora)

---

*Documento de MCSupport - Sistema de Soporte*`,
    },
    {
      title: "Autenticación de Dos Pasos (2FA)",
      slug: "autenticacion-2fa-mcsupport",
      content: `# Autenticación de Dos Pasos (2FA) 🔐

## ¿Qué es 2FA?

La autenticación de dos pasos agrega una capa extra de seguridad. Además de la contraseña, necesitará un código de 6 dígitos de su teléfono.

---

## Aplicaciones Recomendadas

| Aplicación | Plataforma |
|------------|------------|
| Google Authenticator | iOS / Android |
| Microsoft Authenticator | iOS / Android |
| Authy | iOS / Android / Desktop |

---

## Cómo Habilitar 2FA

### Paso 1: Acceder a Configuración
1. Click en su nombre → **Settings**
2. Seleccione la pestaña **Seguridad**
3. Click en **"Habilitar Autenticación de 2 Pasos"**

### Paso 2: Escanear Código QR
1. Se mostrará un código QR
2. Abra su app autenticadora
3. Escanee el código QR

### Paso 3: Verificar
1. Ingrese el código de 6 dígitos mostrado en la app
2. Click **"Verificar y Habilitar"**

### Paso 4: Guardar Códigos de Respaldo ⚠️
- Se mostrarán **8 códigos de respaldo**
- **Solo se muestran UNA VEZ**
- Descárguelos y guárdelos en lugar seguro

---

## Iniciar Sesión con 2FA

1. Ingrese email y contraseña
2. Ingrese el código de 6 dígitos de su app
3. Click **"Verificar"**

---

## Códigos de Respaldo

Si perdió su teléfono:
1. Click "Usar código de respaldo"
2. Ingrese uno de sus 8 códigos guardados
3. El código usado se elimina automáticamente

---

*Documento de MCSupport - Sistema de Soporte*`,
    },
  ];

  for (const article of mcSupportArticles) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const art = article as any;

    await prisma.article.upsert({
      where: { slug: art.slug },
      update: {
        title: art.title,
        content: art.content,
        isPublished: true,
        isInternal: !!art.isInternal,
      },
      create: {
        title: art.title,
        slug: art.slug,
        content: art.content,
        isPublished: true,
        isInternal: !!art.isInternal,
        categoryId: categoryMCSupport.id,
        authorId: admin.id,
      },
    });
  }

  console.log("Seeded MCSupport documentation articles");

  // --- SEMILLA DE HABILIDADES para Asignación Inteligente ---
  // Las habilidades ayudan a LAU a asignar tickets a la persona correcta basada en experiencia
  const skillsData: { email: string; skills: string[] }[] = [
    {
      email: "heri.espinosa@multicomputos.com",
      skills: [
        "consultoria",
        "desarrollo",
        "servicio",
        "soporte",
        "redes",
        "infraestructura",
        "contabilidad",
        "netsuite",
        "erp",
        "implementacion",
        "scripting",
        "suitescript",
        "integracion",
        "automatizacion",
        "api",
        "instalacion",
        "procesos",
        "javascript",
        "typescript",
        "aplicacion",
        "react",
        "nextjs",
        "frontend",
        "nodejs",
        "backend",
        "hardware",
        "facturacion",
        "dgii",
        "impuestos",
        "capacitacion",
        "documentacion",
      ],
    },
    {
      email: "fleirin@multicomputos.com",
      skills: ["desarrollo", "netsuite", "javascript", "typescript"],
    },
    {
      email: "argenis@multicomputos.com",
      skills: ["desarrollo", "react", "nextjs", "frontend"],
    },
    {
      email: "eric@multicomputos.com",
      skills: ["desarrollo", "nodejs", "backend", "api"],
    },
    {
      email: "alberto@multicomputos.com",
      skills: ["netsuite", "soporte", "erp", "implementacion"],
    },
    {
      email: "joaquin@multicomputos.com",
      skills: ["soporte", "hardware", "redes", "instalacion"],
    },
    {
      email: "jose@multicomputos.com",
      skills: ["consultoria", "facturacion", "dgii", "impuestos"],
    },
    {
      email: "luis@multicomputos.com",
      skills: ["consultoria", "netsuite", "erp", "procesos"],
    },
    {
      email: "laura.lopez@multicomputos.com",
      skills: ["consultoria", "capacitacion", "documentacion"],
    },
  ];

  // Paso 1: Crear todas las habilidades únicas en el catálogo
  const allSkillNames = [...new Set(skillsData.flatMap((u) => u.skills))];

  for (const skillName of allSkillNames) {
    await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName },
    });
  }
  console.log(`Seeded ${allSkillNames.length} skills in catalog`);

  // Paso 2: Vincular usuarios a habilidades vía tabla de unión UserSkill
  for (const userData of skillsData) {
    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (user) {
      for (const skillName of userData.skills) {
        const skill = await prisma.skill.findUnique({
          where: { name: skillName },
        });
        if (skill) {
          await prisma.userSkill.upsert({
            where: { userId_skillId: { userId: user.id, skillId: skill.id } },
            update: {},
            create: { userId: user.id, skillId: skill.id },
          });
        }
      }
    }
  }

  console.log("Seeded user skills for smart assignment");
  console.log("Seeding completed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
