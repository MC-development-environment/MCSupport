import { describe, it, expect, vi, beforeEach } from "vitest";
import { addMessage } from "@/common/actions/ticket-actions";
import { prisma } from "@/infrastructure/db/prisma";
import { auth } from "@/core/auth";
import { logActivity } from "@/core/services/audit-service";

// Mocks
vi.mock("@/infrastructure/db/prisma", () => ({
  prisma: {
    case: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    message: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    systemConfig: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/infrastructure/services/email/email-service", () => ({
  sendEmail: vi.fn(),
  BASE_URL: "http://localhost:3000",
}));

vi.mock("@/core/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/core/services/ticket-helpers", () => ({
  getTicketRecipients: vi.fn(),
}));

// Mock Audit Service to avoid side effects
vi.mock("@/core/services/audit-service", () => ({
  logActivity: vi.fn(),
  AuditAction: { STATUS_CHANGE: "STATUS_CHANGE" },
  AuditEntity: { TICKET: "TICKET" },
}));

// Mock LAU
vi.mock("@/infrastructure/adapters/lau", () => ({
  AssistantService: {
    detectLanguage: () => "es",
  },
}));

import { getTicketRecipients } from "@/core/services/ticket-helpers";

describe("ticket-actions status automation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addMessage - Auto IN_PROGRESS", () => {
    it("should update status to IN_PROGRESS when collaborator responds to OPEN ticket", async () => {
      // Setup Auth as a Technician
      (auth as any).mockResolvedValue({
        user: { id: "tech-id", role: "TECHNICIAN" },
      });

      // Setup Ticket as OPEN, owned by Client
      const mockTicket = {
        id: "ticket-123",
        ticketNumber: "CN-123",
        status: "OPEN",
        userId: "client-id",
        user: { email: "client@example.com" },
        description: "Help me",
      };

      // Setup Prisms mocks
      (prisma.case.findUnique as any).mockResolvedValue(mockTicket);
      (prisma.message.create as any).mockResolvedValue({});

      // Mock finding the user role for the check we added
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "tech-id",
        role: "TECHNICIAN",
      });

      // Mock recipients for email notification
      (getTicketRecipients as any).mockResolvedValue({
        to: "client@example.com",
        cc: [],
      });

      // Execute
      await addMessage("ticket-123", "Investigating now");

      // Verify Status Update
      expect(prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ticket-123" },
          data: { status: "IN_PROGRESS" },
        })
      );

      // Verify Log Activity
      expect(logActivity).toHaveBeenCalledWith(
        "STATUS_CHANGE",
        "TICKET",
        "ticket-123",
        expect.objectContaining({
          oldStatus: "OPEN",
          newStatus: "IN_PROGRESS",
          reason: "Collaborator response",
        })
      );
    });

    it("should NOT update status if Virtual Assistant responds", async () => {
      // Setup Auth as Virtual Assistant (or system causing it)
      // Note: usually assistant runs as system but if we simulate the check:
      (auth as any).mockResolvedValue({
        user: { id: "lau-id", role: "VIRTUAL_ASSISTANT" },
      });

      const mockTicket = {
        id: "ticket-123",
        ticketNumber: "CN-123",
        status: "OPEN",
        userId: "client-id",
        user: { email: "client@example.com" },
      };

      (prisma.case.findUnique as any).mockResolvedValue(mockTicket);
      (prisma.message.create as any).mockResolvedValue({});
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "lau-id",
        role: "VIRTUAL_ASSISTANT",
      });
      (getTicketRecipients as any).mockResolvedValue({
        to: "client@example.com",
        cc: [],
      });

      await addMessage("ticket-123", "Hello I am Lau");

      // Verify NO Status Update
      expect(prisma.case.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "IN_PROGRESS" },
        })
      );
    });

    it("should NOT update status if Ticket is already IN_PROGRESS", async () => {
      (auth as any).mockResolvedValue({
        user: { id: "tech-id", role: "TECHNICIAN" },
      });

      const mockTicket = {
        id: "ticket-123",
        status: "IN_PROGRESS", // Already in progress
        userId: "client-id",
      };

      (prisma.case.findUnique as any).mockResolvedValue(mockTicket);
      (prisma.message.create as any).mockResolvedValue({});
      // It might fetch user, but logic should fail before update
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "tech-id",
        role: "TECHNICIAN",
      });

      await addMessage("ticket-123", "Update");

      expect(prisma.case.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: "IN_PROGRESS" },
        })
      );
    });
  });
});
