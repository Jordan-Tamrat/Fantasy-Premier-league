import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/services/auditService";

const RESET_LINK_EXPIRY_HOURS = 24;

/**
 * Self-serve password reset without email delivery.
 *
 * There is no mail provider in this app, so identity is proven with the FPL
 * Entry ID the member has linked to their account — something they know and
 * can look up, but that isn't stored anywhere in the app's UI for other
 * members to read off. This is a deliberate convenience-over-security trade
 * for a private league of friends: an entry ID is semi-public on FPL, so this
 * is not a defence against a determined attacker, only against someone
 * casually poking at the login page.
 */
export async function resetPasswordWithFplEntryId(
  email: string,
  fplEntryId: number,
  newPassword: string,
) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { fplAccount: true },
  });

  // Deliberately identical failure for "no such user", "no linked FPL team"
  // and "wrong entry ID", so this can't be used to discover which emails are
  // registered or which entry ID belongs to an account.
  const failure = new Error(
    "Those details don't match. Check the email and FPL Entry ID, or ask the admin for help.",
  );

  if (!user || user.status !== "ACTIVE") throw failure;
  if (!user.fplAccount || user.fplAccount.fplEntryId !== fplEntryId) throw failure;

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await writeAuditLog(prisma, {
    actorUserId: user.id,
    action: "PASSWORD_RESET_SELF_SERVICE",
    entityType: "User",
    entityId: user.id,
    reason: "Verified with linked FPL Entry ID",
  });

  return user;
}

/**
 * Admin fallback: issues a single-use reset link for a member who can't use
 * the self-serve flow (usually because they never linked an FPL team). Any
 * previously issued unused token for that member is invalidated first, so
 * only the newest link ever works.
 */
export async function createPasswordResetLink(userId: string, actor: { userId: string }) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_LINK_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.create({
      data: { token, userId, issuedById: actor.userId, expiresAt },
    });
    await writeAuditLog(tx, {
      actorUserId: actor.userId,
      action: "PASSWORD_RESET_LINK_ISSUED",
      entityType: "User",
      entityId: userId,
      newValue: { email: user.email },
    });
  });

  return { token, expiresAt };
}

/** Returns the token row only while it's unused and unexpired. */
export async function getValidResetToken(token: string) {
  const row = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, name: true, email: true, status: true } } },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  if (row.user.status !== "ACTIVE") return null;
  return row;
}

/** Consumes a reset link and sets the new password. */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  const row = await getValidResetToken(token);
  if (!row) throw new Error("This reset link is invalid, already used, or has expired.");

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
    await tx.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    await writeAuditLog(tx, {
      actorUserId: row.userId,
      action: "PASSWORD_RESET_VIA_ADMIN_LINK",
      entityType: "User",
      entityId: row.userId,
    });
  });

  return row.user;
}
