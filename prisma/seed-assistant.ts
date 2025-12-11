
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const assistantEmail = 'lau@mcsupport.bot' // Using a .bot TLD to distinguish
    const assistantName = 'LAU (Asistente Virtual)'

    console.log(`Checking for assistant user: ${assistantEmail}...`)

    const upsertedAssistant = await prisma.user.upsert({
        where: { email: assistantEmail },
        update: {
            role: 'SERVICE_OFFICER', // Ensure it has agent privileges
            name: assistantName
        },
        create: {
            email: assistantEmail,
            name: assistantName,
            password: await hash('lau-secure-password-' + Date.now(), 10), // Random secure pass, no one logs in as LAU
            role: 'SERVICE_OFFICER',
            emailVerified: new Date(),
        },
    })

    console.log(`Assistant User ensured: ${upsertedAssistant.name} (${upsertedAssistant.id})`)

    // Also ensure SystemConfig exists with defaults
    const config = await prisma.systemConfig.findFirst();
    if (!config) {
        await prisma.systemConfig.create({
            data: {
                assistantName: 'LAU',
                assistantEnabled: true
            }
        })
        console.log("Created default SystemConfig")
    }
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
