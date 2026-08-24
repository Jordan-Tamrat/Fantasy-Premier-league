import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/services/auditService";
import { notifyEveryone } from "@/services/notificationService";
import { postSystemMessage } from "@/services/chatService";

export async function listAnnouncements(take = 20) {
  return prisma.announcement.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getLatestAnnouncement() {
  return prisma.announcement.findFirst({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** An announcement lands in three places at once: the list, the chat, and everyone's notifications. */
export async function createAnnouncement(input: { title: string; body: string }, actor: { userId: string }) {
  return prisma.$transaction(async (tx) => {
    const announcement = await tx.announcement.create({
      data: { title: input.title, body: input.body, authorId: actor.userId },
    });

    await postSystemMessage(tx, `📢 ${input.title}\n${input.body}`);
    await notifyEveryone(tx, {
      type: "ANNOUNCEMENT",
      title: input.title,
      body: input.body,
      href: "/announcements",
    });
    await writeAuditLog(tx, {
      actorUserId: actor.userId,
      action: "ANNOUNCEMENT_CREATED",
      entityType: "Announcement",
      entityId: announcement.id,
      newValue: { title: input.title },
    });

    return announcement;
  });
}

export async function deleteAnnouncement(announcementId: string, actor: { userId: string }) {
  const existing = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!existing) throw new Error("Announcement not found");

  await prisma.announcement.delete({ where: { id: announcementId } });
  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "ANNOUNCEMENT_DELETED",
    entityType: "Announcement",
    entityId: announcementId,
    oldValue: { title: existing.title, body: existing.body },
  });
}
