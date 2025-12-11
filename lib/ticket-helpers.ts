import { prisma } from './prisma';

/**
 * Helper function to get email recipients for a ticket
 * Returns primary recipient (to) and CC recipients
 */
export async function getTicketRecipients(ticketId: string): Promise<{
    to: string | null;
    cc: string[];
}> {
    const ticket = await prisma.case.findUnique({
        where: { id: ticketId },
        select: {
            user: {
                select: { email: true }
            },
            ccEmails: true
        }
    });

    if (!ticket) {
        return { to: null, cc: [] };
    }

    return {
        to: ticket.user.email,
        cc: ticket.ccEmails || []
    };
}
