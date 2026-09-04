import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/services/auditService";
import { notifyUsers } from "@/services/notificationService";
import type { DisputeCategory, DisputeStatus } from "@/lib/generated/prisma/client";

export async function listDisputesForUser(userId: string) {
  return prisma.dispute.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllDisputes() {
  return prisma.dispute.findMany({
    include: {
      author: { select: { id: true, name: true, profileImagePath: true } },
      respondedBy: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function createDispute(
  input: { category: DisputeCategory; title: string; description: string },
  actor: { userId: string },
) {
  const dispute = await prisma.dispute.create({
    data: {
      authorId: actor.userId,
      category: input.category,
      title: input.title,
      description: input.description,
    },
  });

  // Admins are the ones who act on disputes, so only they get notified.
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  await notifyUsers(
    prisma,
    admins.map((a) => a.id),
    {
      type: "DISPUTE_UPDATE",
      title: "New complaint raised",
      body: input.title,
      href: "/admin/complaints",
    },
  );

  return dispute;
}

export async function respondToDispute(
  disputeId: string,
  input: { status: DisputeStatus; adminResponse: string },
  actor: { userId: string },
) {
  const existing = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!existing) throw new Error("Dispute not found");

  const isClosing = input.status === "RESOLVED" || input.status === "REJECTED";
  const updated = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: input.status,
      adminResponse: input.adminResponse,
      respondedById: actor.userId,
      resolvedAt: isClosing ? new Date() : null,
    },
  });

  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "DISPUTE_UPDATED",
    entityType: "Dispute",
    entityId: disputeId,
    oldValue: { status: existing.status },
    newValue: { status: input.status },
    reason: input.adminResponse,
  });

  await notifyUsers(prisma, [existing.authorId], {
    type: "DISPUTE_UPDATE",
    title: `Your complaint was updated: ${input.status.replace("_", " ").toLowerCase()}`,
    body: input.adminResponse,
    href: "/complaints",
  });

  return updated;
}
