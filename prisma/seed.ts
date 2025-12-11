import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
    // Departments
    const deptSupport = await prisma.department.upsert({ where: { name: 'Soporte' }, update: {}, create: { name: 'Soporte' } })
    const deptDev = await prisma.department.upsert({ where: { name: 'Desarrollo' }, update: {}, create: { name: 'Desarrollo' } })
    const deptConsulting = await prisma.department.upsert({ where: { name: 'Consultoria' }, update: {}, create: { name: 'Consultoria' } })

    // const deptAuto = await prisma.department.upsert({ where: { name: 'Automatizacion' }, update: {}, create: { name: 'Automatizacion' } })
    // const deptAcc = await prisma.department.upsert({ where: { name: 'Contabilidad' }, update: {}, create: { name: 'Contabilidad' } })

    const passwordHash = await hash('123456', 10)

    // Roles Seeding
    const admin = await prisma.user.upsert({
        where: { email: 'admin@multicomputos.com' },
        update: { role: 'MANAGER', departmentId: deptSupport.id, password: passwordHash },
        create: {
            email: 'admin@multicomputos.com',
            name: 'Admin Manager',
            password: passwordHash,
            role: 'MANAGER',
            departmentId: deptSupport.id
        }
    })

    await prisma.user.upsert({
        where: { email: 'michael@multicomputos.com' },
        update: { role: 'MANAGER', departmentId: deptSupport.id, password: passwordHash },
        create: {
            email: 'michael@multicomputos.com',
            name: 'Michael Albert (Manager)',
            password: passwordHash,
            role: 'MANAGER',
            departmentId: deptSupport.id
        }
    })

    await prisma.user.upsert({
        where: { email: 'claudia@multicomputos.com' },
        update: { role: 'SERVICE_OFFICER', departmentId: deptSupport.id, password: passwordHash },
        create: {
            email: 'claudia@multicomputos.com',
            name: 'Claudia Perez(Oficial de Servicio)',
            password: passwordHash,
            role: 'SERVICE_OFFICER',
            departmentId: deptSupport.id
        }
    })

    await prisma.user.upsert({
        where: { email: 'fleirin@multicomputos.com' },
        update: { role: 'TEAM_LEAD', departmentId: deptDev.id, password: passwordHash },
        create: {
            email: 'fleirin@multicomputos.com',
            name: 'Fleirin Cipion (Lider de equipo)',
            password: passwordHash,
            role: 'TEAM_LEAD',
            departmentId: deptSupport.id
        }
    })

    await prisma.user.upsert({
        where: { email: 'jose@multicomputos.com' },
        update: { role: 'TEAM_LEAD', departmentId: deptConsulting.id, password: passwordHash },
        create: {
            email: 'jose@multicomputos.com',
            name: 'Jose Bobadilla (Lider de equipo)',
            password: passwordHash,
            role: 'TEAM_LEAD',
            departmentId: deptSupport.id
        }
    })

    await prisma.user.upsert({
        where: { email: 'alberto@multicomputos.com' },
        update: { role: 'TECHNICAL_LEAD', departmentId: deptSupport.id, password: passwordHash },
        create: {
            email: 'alberto@multicomputos.com',
            name: 'Alberto Mora (Líder Técnico)',
            password: passwordHash,
            role: 'TECHNICAL_LEAD',
            departmentId: deptSupport.id
        }
    })

    await prisma.user.upsert({
        where: { email: 'luis@multicomputos.com' },
        update: { role: 'TECHNICAL_LEAD', departmentId: deptConsulting.id, password: passwordHash },
        create: {
            email: 'luis@multicomputos.com',
            name: 'Luis Vargas (Líder Técnico)',
            password: passwordHash,
            role: 'TECHNICAL_LEAD',
            departmentId: deptSupport.id
        }
    })

    await prisma.user.upsert({
        where: { email: 'eric@multicomputos.com' },
        update: { role: 'TECHNICIAN', departmentId: deptDev.id, password: passwordHash },
        create: {
            email: 'eric@multicomputos.com',
            name: 'Eric Collado (Técnico)',
            password: passwordHash,
            role: 'TECHNICIAN',
            departmentId: deptSupport.id
        }
    })

    await prisma.user.upsert({
        where: { email: 'laura@multicomputos.com' },
        update: { role: 'TECHNICIAN', departmentId: deptConsulting.id, password: passwordHash },
        create: {
            email: 'laura@multicomputos.com',
            name: 'Laura Lopez (Técnico)',
            password: passwordHash,
            role: 'TECHNICIAN',
            departmentId: deptSupport.id
        }
    })

    await prisma.user.upsert({
        where: { email: 'heri@multicomputos.com' },
        update: { role: 'DEVELOPER', departmentId: deptDev.id, password: passwordHash },
        create: {
            email: 'heri@multicomputos.com',
            name: 'Heri Espinosa (Desarrollador)',
            password: passwordHash,
            role: 'DEVELOPER',
            departmentId: deptDev.id
        }
    })

    // Assign 'user' variable for ticket creation
    const user = admin;
    console.log('Seeded Users: admin, lider, tech, dev @multicomputos.com')

    // --- CLIENTS SEEDING ---
    const clientHidalgos = await prisma.user.upsert({
        where: { email: 'client@hidalgos.com' },
        update: { role: 'CLIENT', password: passwordHash },
        create: {
            email: 'client@hidalgos.com',
            name: 'Farmacia Los Hidalgos (Cliente)',
            password: passwordHash,
            role: 'CLIENT'
        }
    })

    const clientRamos = await prisma.user.upsert({
        where: { email: 'client@gruporamos.com' },
        update: { role: 'CLIENT', password: passwordHash },
        create: {
            email: 'client@gruporamos.com',
            name: 'Grupo Ramos (Cliente)',
            password: passwordHash,
            role: 'CLIENT'
        }
    })

    const clientBPD = await prisma.user.upsert({
        where: { email: 'client@bpd.com.do' },
        update: { role: 'CLIENT', password: passwordHash },
        create: {
            email: 'client@bpd.com.do',
            name: 'Banco Popular (Cliente)',
            password: passwordHash,
            role: 'CLIENT'
        }
    })

    console.log('Seeded Clients: Hidalgos, Ramos, BPD')

    // Create Sample Tickets
    // Check if tickets exist to avoid duplication on re-run if we don't want to use createMany skipDuplicates (Postgres unique constraint needed)
    // For simplicity, we just create them. If we wanted idempotency we'd check.
    // Given the previous run might have failed or succeeded halfway, let's just count.

    const count = await prisma.case.count();
    if (count === 0) {
        await prisma.case.createMany({
            data: [
                // Factura Electrónica
                {
                    title: 'Error envío DGII XML - Factura Electrónica',
                    description: 'Al intentar enviar el lote de facturas de ayer, recibimos un error 500 del servicio de la DGII. El XML parece estar mal formado según el log.',
                    priority: 'CRITICAL',
                    status: 'OPEN',
                    userId: clientHidalgos.id,
                    ticketNumber: 'FE-001'
                },
                {
                    title: 'Configuración secuencia NCF B01',
                    description: 'Necesitamos asistencia para configurar la nueva secuencia de Comprobantes Fiscales (B01) que vence el próximo mes.',
                    priority: 'MEDIUM',
                    status: 'IN_PROGRESS',
                    userId: clientRamos.id,
                    ticketNumber: 'FE-002'
                },

                // Implementaciones ERP Netsuite
                {
                    title: 'Error en Workflow de Aprobación de Compras',
                    description: 'El flujo de aprobación se detiene cuando el monto supera los 50,000 DOP. El supervisor no recibe la notificación.',
                    priority: 'HIGH',
                    status: 'OPEN',
                    userId: clientBPD.id,
                    ticketNumber: 'NS-IMP-001'
                },
                {
                    title: 'Duda sobre reporte de Inventario por Ubicación',
                    description: 'El reporte nativo no muestra stock en tránsito. ¿Cómo podemos personalizarlo?',
                    priority: 'LOW',
                    status: 'WAITING_CUSTOMER',
                    userId: clientHidalgos.id,
                    ticketNumber: 'NS-IMP-002'
                },

                // Desarrollo de Aplicaciones
                {
                    title: 'Bug en integración API Shopify',
                    description: 'Las órdenes creadas en Shopify no están cayendo en el ERP si el cliente tiene caracteres especiales en el nombre.',
                    priority: 'HIGH',
                    status: 'IN_PROGRESS',
                    userId: user.id, // Internal test
                    ticketNumber: 'DEV-001'
                },
                {
                    title: 'Nueva funcionalidad Portal Clientes',
                    description: 'Requerimiento para agregar botón de descarga de estados de cuenta en PDF.',
                    priority: 'MEDIUM',
                    status: 'OPEN',
                    userId: clientRamos.id,
                    ticketNumber: 'DEV-002'
                },

                // Consultorías
                {
                    title: 'Optimización de procesos de cierre fiscal',
                    description: 'Consultoría solicitada para revisar los tiempos de cierre mensual, actualmente toman 10 días.',
                    priority: 'LOW',
                    status: 'RESOLVED',
                    userId: clientBPD.id,
                    ticketNumber: 'CONS-001'
                },
                {
                    title: 'Auditoría de permisos de usuario',
                    description: 'Revisión trimestral de accesos y roles en el sistema ERP.',
                    priority: 'MEDIUM',
                    status: 'OPEN',
                    userId: clientRamos.id,
                    ticketNumber: 'CONS-002'
                },

                // Original seeds tailored
                {
                    title: 'Fallo integración Legacy System',
                    description: 'El sistema legado no responde al ping.',
                    priority: 'CRITICAL',
                    status: 'CLOSED',
                    userId: user.id,
                    ticketNumber: 'LEG-001'
                }
            ]
        })
        console.log('Seeded sample tickets.')
    } else {
        console.log('Tickets already exist, skipping.')
    }

    // Create Categories
    await prisma.category.createMany({
        data: [
            { name: 'General', slug: 'general', description: 'General questions' },
            { name: 'Billing', slug: 'billing', description: 'Invoices and payments' },
            { name: 'Technical', slug: 'technical', description: 'Technical support' },
        ],
        skipDuplicates: true
    })

    console.log('Seeding completed.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
