
import { auth } from "@/core/auth";
import { prisma } from "@/infrastructure/db/prisma";
import { Prisma } from "@prisma/client";

export enum AuditAction {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    ASSIGN = "ASSIGN",
    LOGIN = "LOGIN",
    STATUS_CHANGE = "STATUS_CHANGE",
}

export enum AuditEntity {
    TICKET = "TICKET",
    USER = "USER",
    SYSTEM = "SYSTEM",
    ARTICLE = "ARTICLE",
}

export async function logActivity(
    action: AuditAction | string,
    entity: AuditEntity | string,
    entityId: string,
    details?: Prisma.InputJsonValue
) {
    try {
        const session = await auth();
        const actorId = session?.user?.id;

        if (!actorId) {
            console.warn("Audit log attempted without authenticated user:", { action, entity, entityId });
            return;
        }

        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                actorId,
                details: details ? details : undefined,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
}
