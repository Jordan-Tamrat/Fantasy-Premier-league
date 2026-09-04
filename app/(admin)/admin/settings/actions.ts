"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLeagueSettingsSchema } from "@/lib/validations/leagueSettings.schema";
import { writeAuditLog } from "@/services/auditService";

export async function updateLeagueSettingsAction(_prevState: string | undefined, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = updateLeagueSettingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const before = await prisma.leagueSettings.findUnique({ where: { id: "default" } });
  const fplLeagueId = typeof parsed.data.fplLeagueId === "number" ? parsed.data.fplLeagueId : null;

  await prisma.leagueSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      leagueName: parsed.data.leagueName,
      currency: parsed.data.currency,
      defaultEntryFee: parsed.data.defaultEntryFee,
      defaultPaymentDeadlineOffsetHours: parsed.data.defaultPaymentDeadlineOffsetHours,
      defaultMinParticipants: parsed.data.defaultMinParticipants,
      leagueTelebirrNumber: parsed.data.leagueTelebirrNumber || null,
      leagueCbeAccountNumber: parsed.data.leagueCbeAccountNumber || null,
      leagueAccountName: parsed.data.leagueAccountName || null,
      fplLeagueId,
    },
    update: {
      leagueName: parsed.data.leagueName,
      currency: parsed.data.currency,
      defaultEntryFee: parsed.data.defaultEntryFee,
      defaultPaymentDeadlineOffsetHours: parsed.data.defaultPaymentDeadlineOffsetHours,
      defaultMinParticipants: parsed.data.defaultMinParticipants,
      leagueTelebirrNumber: parsed.data.leagueTelebirrNumber || null,
      leagueCbeAccountNumber: parsed.data.leagueCbeAccountNumber || null,
      leagueAccountName: parsed.data.leagueAccountName || null,
      fplLeagueId,
    },
  });

  await writeAuditLog(prisma, {
    actorUserId: admin.id,
    action: "LEAGUE_SETTINGS_UPDATED",
    entityType: "LeagueSettings",
    entityId: "default",
    oldValue: before,
    newValue: parsed.data,
  });

  revalidatePath("/admin/settings");
  return "Saved";
}
