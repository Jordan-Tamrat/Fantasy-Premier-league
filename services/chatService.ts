import { prisma } from "@/lib/prisma";
import { STORAGE_BUCKETS, buildProofPath, uploadProofImage } from "@/lib/storage";
import { writeAuditLog } from "@/services/auditService";
import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";

type PrismaTx = PrismaClient | Prisma.TransactionClient;

const MESSAGE_PAGE_SIZE = 50;
// A client that's fallen further behind than this (tab left open overnight)
// gets a capped batch rather than an unbounded query; reloading the page
// fetches a clean recent window.
const POLL_BATCH_LIMIT = 100;

/**
 * One page of history, newest page first. Pass `before` (the createdAt of the
 * oldest message you already hold) to walk backwards.
 *
 * Fetches one row beyond the page size purely to learn whether more history
 * exists, which avoids a second COUNT query.
 */
export async function listMessages(options?: { before?: Date }) {
  const rows = await prisma.chatMessage.findMany({
    where: options?.before ? { createdAt: { lt: options.before } } : undefined,
    include: {
      sender: { select: { id: true, name: true, role: true, profileImagePath: true } },
      replyTo: { select: { id: true, content: true, sender: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: MESSAGE_PAGE_SIZE + 1,
  });

  const hasMore = rows.length > MESSAGE_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, MESSAGE_PAGE_SIZE) : rows;
  // Queried newest-first for the LIMIT, returned oldest-first for rendering.
  return { messages: page.reverse(), hasMore };
}

export async function listMessagesSince(since: Date) {
  return prisma.chatMessage.findMany({
    where: { createdAt: { gt: since } },
    include: {
      sender: { select: { id: true, name: true, role: true, profileImagePath: true } },
      replyTo: { select: { id: true, content: true, sender: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take: POLL_BATCH_LIMIT,
  });
}

export async function listPinnedMessages() {
  return prisma.chatMessage.findMany({
    where: { pinnedAt: { not: null }, deletedAt: null },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { pinnedAt: "desc" },
  });
}

interface SendMessageInput {
  senderId: string;
  content: string;
  replyToId?: string;
  attachment?: File;
}

export async function sendMessage(input: SendMessageInput) {
  let attachmentPath: string | undefined;
  if (input.attachment) {
    attachmentPath = buildProofPath("chat", input.senderId, input.attachment.name);
    await uploadProofImage(STORAGE_BUCKETS.chatAttachments, attachmentPath, input.attachment);
  }

  return prisma.chatMessage.create({
    data: {
      senderId: input.senderId,
      content: input.content,
      type: attachmentPath ? "IMAGE" : "TEXT",
      attachmentPath,
      replyToId: input.replyToId,
    },
  });
}

/**
 * Posts an automated message (results final, payment verified, GW opened…).
 * Takes a transaction client so it can be part of the same commit as the
 * event that triggered it.
 */
export async function postSystemMessage(tx: PrismaTx, content: string) {
  return tx.chatMessage.create({ data: { type: "SYSTEM", content, senderId: null } });
}

export async function editOwnMessage(messageId: string, userId: string, content: string) {
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new Error("Message not found");
  if (message.senderId !== userId) throw new Error("You can only edit your own messages");
  if (message.deletedAt) throw new Error("This message was deleted");

  return prisma.chatMessage.update({
    where: { id: messageId },
    data: { content, editedAt: new Date() },
  });
}

/**
 * Soft delete. Members can remove their own messages; admins can remove any,
 * which is audit-logged. Admins deliberately cannot *edit* someone else's
 * message — only remove it — so nobody can put words in another member's mouth.
 */
export async function deleteMessage(messageId: string, actor: { userId: string; isAdmin: boolean }) {
  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message) throw new Error("Message not found");

  const isOwn = message.senderId === actor.userId;
  if (!isOwn && !actor.isAdmin) throw new Error("You can only delete your own messages");

  const deleted = await prisma.chatMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), deletedById: actor.userId },
  });

  if (!isOwn) {
    await writeAuditLog(prisma, {
      actorUserId: actor.userId,
      action: "CHAT_MESSAGE_DELETED_BY_ADMIN",
      entityType: "ChatMessage",
      entityId: messageId,
      oldValue: { senderId: message.senderId, content: message.content },
    });
  }

  return deleted;
}

export async function setMessagePinned(messageId: string, pinned: boolean, actorUserId: string) {
  const updated = await prisma.chatMessage.update({
    where: { id: messageId },
    data: { pinnedAt: pinned ? new Date() : null },
  });
  await writeAuditLog(prisma, {
    actorUserId,
    action: pinned ? "CHAT_MESSAGE_PINNED" : "CHAT_MESSAGE_UNPINNED",
    entityType: "ChatMessage",
    entityId: messageId,
  });
  return updated;
}
