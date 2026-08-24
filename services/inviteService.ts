import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/services/auditService";

const INVITE_EXPIRY_DAYS = 7;

interface Actor {
  userId: string;
}

export async function createInvite(email: string, role: "ADMIN" | "MEMBER", actor: Actor) {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw new Error("A member with this email already exists");

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: { email: normalizedEmail, role, token, expiresAt, invitedByUserId: actor.userId },
  });

  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "INVITE_CREATED",
    entityType: "Invite",
    entityId: invite.id,
    newValue: { email: normalizedEmail, role },
  });

  return invite;
}

export async function revokeInvite(inviteId: string, actor: Actor) {
  const invite = await prisma.invite.update({
    where: { id: inviteId },
    data: { status: "REVOKED" },
  });
  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "INVITE_REVOKED",
    entityType: "Invite",
    entityId: inviteId,
  });
  return invite;
}

export async function getInviteByToken(token: string) {
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite) return null;
  if (invite.status !== "PENDING" || invite.expiresAt < new Date()) return null;
  return invite;
}

export async function acceptInvite(token: string, name: string, password: string) {
  const invite = await getInviteByToken(token);
  if (!invite) throw new Error("This invite is invalid or has expired");

  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: invite.email, name, passwordHash, role: invite.role },
    });
    await tx.invite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
    await writeAuditLog(tx, {
      actorUserId: user.id,
      action: "INVITE_ACCEPTED",
      entityType: "User",
      entityId: user.id,
      newValue: { email: user.email, role: user.role },
    });
    return user;
  });
}
