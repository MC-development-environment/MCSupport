import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addMessage, updateTicketStatus } from '@/common/actions/ticket-actions';
import { prisma } from '@/infrastructure/db/prisma';
import { sendEmail } from '@/infrastructure/services/email/email-service';
import { auth } from '@/core/auth';

// Mocks
vi.mock('@/infrastructure/db/prisma', () => ({
    prisma: {
        case: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        message: {
            create: vi.fn(),
        },
    },
}));

vi.mock('@/infrastructure/services/email/email-service', () => ({
    sendEmail: vi.fn(),
    emailStyles: {},
}));

vi.mock('@/core/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/core/services/ticket-helpers', () => ({
    getTicketRecipients: vi.fn(),
}));

// Import mocked helper
import { getTicketRecipients } from '@/core/services/ticket-helpers';

describe('ticket-actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('updateTicketStatus', () => {
        it('should send email notification with CCs when status changes', async () => {
            // Setup mocks
            (auth as any).mockResolvedValue({ user: { id: 'admin-id', role: 'ADMIN' } });

            const mockTicket = {
                id: 'ticket-123',
                ticketNumber: 'CN-123',
                title: 'Test Issue',
                description: 'I need help with my problem', // English description for language detection
                status: 'OPEN',
                user: { email: 'client@example.com' },
            };

            (prisma.case.findUnique as any).mockResolvedValue(mockTicket);
            (prisma.case.update as any).mockResolvedValue({ ...mockTicket, status: 'IN_PROGRESS' });

            (getTicketRecipients as any).mockResolvedValue({
                to: 'client@example.com',
                cc: ['cc1@example.com'],
            });

            // Execute
            await updateTicketStatus('ticket-123', 'IN_PROGRESS');

            // Verify
            expect(getTicketRecipients).toHaveBeenCalledWith('ticket-123');
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'client@example.com',
                cc: ['cc1@example.com'],
                subject: expect.stringContaining('CN-123'), // Just check ticket number is in subject
            }));
        });
    });

    describe('addMessage', () => {
        it('should notify client with CCs when team responds', async () => {
            // Setup mocks
            (auth as any).mockResolvedValue({ user: { id: 'admin-id', role: 'ADMIN', name: 'Admin User' } });

            const mockTicket = {
                id: 'ticket-123',
                ticketNumber: 'CN-123',
                status: 'IN_PROGRESS',
                userId: 'client-id', // Different from auth user -> means Team responding
                user: { email: 'client@example.com' },
            };

            (prisma.case.findUnique as any).mockResolvedValue(mockTicket);
            (prisma.message.create as any).mockResolvedValue({});

            (getTicketRecipients as any).mockResolvedValue({
                to: 'client@example.com',
                cc: ['cc1@example.com'],
            });

            // Execute
            await addMessage('ticket-123', 'Hello client');

            // Verify
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'client@example.com',
                cc: ['cc1@example.com'],
                subject: expect.stringContaining('Nuevo mensaje'),
            }));
        });

        it('should NOT notify client if client responds', async () => {
            // Setup mocks
            (auth as any).mockResolvedValue({ user: { id: 'client-id', role: 'CLIENT' } });

            const mockTicket = {
                id: 'ticket-123',
                ticketNumber: 'CN-123',
                status: 'IN_PROGRESS',
                userId: 'client-id', // Same as auth user -> Client responding
                user: { email: 'client@example.com' },
            };

            (prisma.case.findUnique as any).mockResolvedValue(mockTicket);
            (prisma.message.create as any).mockResolvedValue({});

            // Execute
            await addMessage('ticket-123', 'Hello support');

            // Verify
            // Should NOT send "New message" email to client (himself)
            // It might notify support team (logic not fully mocked here but checking it doesn't send using the client template)
            expect(sendEmail).not.toHaveBeenCalledWith(expect.objectContaining({
                to: 'client@example.com',
            }));
        });
    });
});
