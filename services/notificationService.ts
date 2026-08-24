import { prisma } from "@/lib/prisma";
import type { NotificationType, Prisma, PrismaClient } from "@/lib/generated/prisma/client";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

interface NotifyInput {
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
}

/** Notify specific members. */
export async function notifyUsers(tx: PrismaTx, userIds: string[], input: NotifyInput) {
  if (userIds.length === 0) return;
  await tx.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
    })),
  });
}

/** Notify every active member — used for league-wide events. */
export async function notifyEveryone(tx: PrismaTx, input: NotifyInput, options?: { exceptUserId?: string }) {
  const users = await tx.user.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
  const userIds = users.map((u) => u.id).filter((id) => id !== options?.exceptUserId);
  await notifyUsers(tx, userIds, input);
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function listNotifications(userId: string, take = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
