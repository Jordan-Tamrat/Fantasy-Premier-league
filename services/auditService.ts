import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

interface WriteAuditLogInput {
  actorUserId?: string | null;
  actorLabel?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
}

export async function writeAuditLog(tx: PrismaTx, input: WriteAuditLogInput) {
  return tx.auditLog.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      actorLabel: input.actorLabel,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValue: input.oldValue === undefined ? undefined : (input.oldValue as Prisma.InputJsonValue),
      newValue: input.newValue === undefined ? undefined : (input.newValue as Prisma.InputJsonValue),
      reason: input.reason,
    },
  });
}
