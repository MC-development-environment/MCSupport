"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logActivity, AuditAction, AuditEntity } from "@/lib/audit-service";
import { logger } from "@/lib/logger";

export async function bulkUpdateStatus(ticketIds: string[], newStatus: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  if (!ticketIds.length)
    return { success: false, error: "No tickets selected" };

  try {
    await prisma.case.updateMany({
      where: { id: { in: ticketIds } },
      data: { status: newStatus as any },
    });

    // Audit Log for each ticket (bulk logging isn't supported easily, so loop or simplistic log)
    // For performance, we might skip individual logs or log a "Batch" event if we had that.
    // We'll loop for now to be thorough.
    for (const id of ticketIds) {
      await logActivity(AuditAction.STATUS_CHANGE, AuditEntity.TICKET, id, {
        newStatus,
        action: "BLK_UPDATE",
        actor: session.user.email,
      });
    }

    revalidatePath("/admin/tickets");
    return { success: true, count: ticketIds.length };
  } catch (error) {
    logger.error("Bulk status update failed", error);
    return { success: false, error: "Failed to update tickets" };
  }
}

export async function bulkAssign(ticketIds: string[], assigneeId: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  if (!ticketIds.length)
    return { success: false, error: "No tickets selected" };

  try {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });
    if (!assignee) return { success: false, error: "User not found" };

    await prisma.case.updateMany({
      where: { id: { in: ticketIds } },
      data: { assignedToId: assigneeId },
    });

    for (const id of ticketIds) {
      await logActivity(AuditAction.ASSIGN, AuditEntity.TICKET, id, {
        assignedTo: assignee.email,
        action: "BLK_ASSIGN",
        actor: session.user.email,
      });
    }

    revalidatePath("/admin/tickets");
    return { success: true, count: ticketIds.length };
  } catch (error) {
    logger.error("Bulk assign failed", error);
    return { success: false, error: "Failed to assign tickets" };
  }
}
