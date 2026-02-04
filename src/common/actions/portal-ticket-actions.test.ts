import { describe, it, expect, vi, beforeEach } from 'vitest';
import { closeTicketByClient } from '@/common/actions/portal-ticket-actions';
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
        systemConfig: {
            findFirst: vi.fn().mockResolvedValue({ supportEmail: 'support@example.com' }),
        },
    },
}));

vi.mock('@/infrastructure/services/email/email-service', () => ({
    sendEmail: vi.fn(),
}));

vi.mock('@/core/auth', () => ({
    auth: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

// We need to mock createAuditLog as well since it's used
vi.mock('@/core/services/audit-service', () => ({
    createAuditLog: vi.fn(),
    logActivity: vi.fn(),
    AuditAction: { UPDATE: 'UPDATE' },
    AuditEntity: { TICKET: 'TICKET' },
}));

// Mock Assistant Service
vi.mock('@/infrastructure/adapters/lau', () => ({
    AssistantService: {
        getAssistantUser: vi.fn().mockResolvedValue({ id: 'lau-id' }),
    },
}));

// Mock System Config
vi.mock('@/common/actions/settings-actions', () => ({
    getSystemConfig: vi.fn().mockResolvedValue({ supportEmail: 'support@example.com' }),
}));

describe('portal-ticket-actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('closeTicketByClient', () => {
        it('should successfully close ticket if owner and WAITING_CUSTOMER', async () => {
            // Setup
            const userId = 'user-123';
            (auth as any).mockResolvedValue({ user: { id: userId } });

            const mockTicket = {
                id: 'ticket-1',
                ticketNumber: 'CN-001',
                title: 'Issue',
                userId: userId, // Matches auth user
                status: 'WAITING_CUSTOMER',
            };

            (prisma.case.findUnique as any).mockResolvedValue(mockTicket);
            (prisma.case.update as any).mockResolvedValue({ ...mockTicket, status: 'RESOLVED' });

            // Execute
            await closeTicketByClient('ticket-1');

            // Verify
            expect(prisma.case.update).toHaveBeenCalledWith({
                where: { id: 'ticket-1' },
                data: { status: 'RESOLVED' },
            });

            expect(prisma.message.create).toHaveBeenCalled(); // Auto message
            expect(sendEmail).toHaveBeenCalled(); // Notify support
        });

        it('should fail if user is not authorized/owner', async () => {
            // Setup
            const userId = 'user-123';
            (auth as any).mockResolvedValue({ user: { id: userId } });

            const mockTicket = {
                id: 'ticket-1',
                ticketNumber: 'CN-001',
                userId: 'other-user', // Different user
                status: 'WAITING_CUSTOMER',
            };

            (prisma.case.findUnique as any).mockResolvedValue(mockTicket);

            // Execute
            const result = await closeTicketByClient('ticket-1');

            // Verify
            expect(result).toEqual({ success: false, error: "No autorizado para cerrar este ticket" });
            expect(prisma.case.update).not.toHaveBeenCalled();
        });

        it('should fail if status is not WAITING_CUSTOMER', async () => {
            // Setup
            const userId = 'user-123';
            (auth as any).mockResolvedValue({ user: { id: userId } });

            const mockTicket = {
                id: 'ticket-1',
                ticketNumber: 'CN-001',
                userId: userId,
                status: 'IN_PROGRESS', // Wrong status
            };

            (prisma.case.findUnique as any).mockResolvedValue(mockTicket);

            // Execute
            const result = await closeTicketByClient('ticket-1');

            // Verify
            expect(result).toEqual({ success: false, error: "El ticket debe estar esperando tu respuesta para cerrarlo" });
            expect(prisma.case.update).not.toHaveBeenCalled();
        });
    });
});
