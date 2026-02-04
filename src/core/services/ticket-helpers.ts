import { prisma } from "@/infrastructure/db/prisma";

/**
 * Función auxiliar para obtener destinatarios de correo para un ticket
 * Retorna destinatario principal (to) y destinatarios CC
 */
export async function getTicketRecipients(ticketId: string): Promise<{
  to: string | null;
  cc: string[];
}> {
  const ticket = await prisma.case.findUnique({
    where: { id: ticketId },
    select: {
      user: {
        select: { email: true },
      },
      ccEmails: true,
    },
  });

  if (!ticket) {
    return { to: null, cc: [] };
  }

  return {
    to: ticket.user.email,
    cc: ticket.ccEmails || [],
  };
}
