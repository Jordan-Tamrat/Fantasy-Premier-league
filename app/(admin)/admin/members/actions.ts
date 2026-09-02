"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/services/auditService";
import { createInvite, revokeInvite } from "@/services/inviteService";
import { createPasswordResetLink } from "@/services/passwordResetService";
import { createInviteSchema } from "@/lib/validations/invite.schema";

export async function setMemberRoleAction(userId: string, role: "ADMIN" | "MEMBER") {
  const admin = await requireAdmin();
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({ where: { id: userId }, data: { role } });
  await writeAuditLog(prisma, {
    actorUserId: admin.id,
    action: "MEMBER_ROLE_CHANGED",
    entityType: "User",
    entityId: userId,
    oldValue: { role: target.role },
    newValue: { role },
  });
  revalidatePath("/admin/members");
}

export async function setMemberStatusAction(userId: string, status: "ACTIVE" | "DISABLED") {
  const admin = await requireAdmin();
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({ where: { id: userId }, data: { status } });
  await writeAuditLog(prisma, {
    actorUserId: admin.id,
    action: "MEMBER_STATUS_CHANGED",
    entityType: "User",
    entityId: userId,
    oldValue: { status: target.status },
    newValue: { status },
  });
  revalidatePath("/admin/members");
}

/**
 * Fallback for members who can't self-reset (no linked FPL team). Returns the
 * one-time link for the admin to copy and send — there's no email delivery.
 */
export async function createPasswordResetLinkAction(userId: string): Promise<string> {
  const admin = await requireAdmin();
  const { token } = await createPasswordResetLink(userId, { userId: admin.id });
  revalidatePath("/admin/members");
  return `/reset-password/${token}`;
}

export async function createInviteAction(_prevState: string | undefined, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = createInviteSchema.safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  try {
    await createInvite(parsed.data.email, parsed.data.role, { userId: admin.id });
  } catch (error) {
    return error instanceof Error ? error.message : "Could not create invite";
  }

  revalidatePath("/admin/invites");
}

export async function revokeInviteAction(inviteId: string) {
  const admin = await requireAdmin();
  await revokeInvite(inviteId, { userId: admin.id });
  revalidatePath("/admin/invites");
}
