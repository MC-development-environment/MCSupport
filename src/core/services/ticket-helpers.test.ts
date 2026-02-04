import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTicketRecipients } from '@/core/services/ticket-helpers';
import { prisma } from '@/infrastructure/db/prisma';

// Mock Prisma
vi.mock('@/infrastructure/db/prisma', () => ({
    prisma: {
        case: {
            findUnique: vi.fn(),
        },
    },
}));

describe('getTicketRecipients', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return to and cc emails correctly', async () => {
        // Mock successful response
        (prisma.case.findUnique as any).mockResolvedValue({
            user: { email: 'user@example.com' },
            ccEmails: ['cc1@example.com', 'cc2@example.com'],
        });

        const result = await getTicketRecipients('ticket-123');

        expect(prisma.case.findUnique).toHaveBeenCalledWith({
            where: { id: 'ticket-123' },
            select: {
                user: { select: { email: true } },
                ccEmails: true,
            },
        });

        expect(result).toEqual({
            to: 'user@example.com',
            cc: ['cc1@example.com', 'cc2@example.com'],
        });
    });

    it('should handle empty ccEmails', async () => {
        (prisma.case.findUnique as any).mockResolvedValue({
            user: { email: 'user@example.com' },
            ccEmails: [],
        });

        const result = await getTicketRecipients('ticket-123');

        expect(result).toEqual({
            to: 'user@example.com',
            cc: [],
        });
    });

    it('should handle missing ticket', async () => {
        (prisma.case.findUnique as any).mockResolvedValue(null);

        const result = await getTicketRecipients('non-existent');

        expect(result).toEqual({ to: null, cc: [] });
    });
});
