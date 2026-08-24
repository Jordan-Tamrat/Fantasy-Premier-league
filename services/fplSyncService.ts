import { prisma } from "@/lib/prisma";
import { FPLService } from "@/lib/fpl";
import { writeAuditLog } from "@/services/auditService";

interface SyncActor {
  userId?: string;
  label?: string;
}

interface SyncFailure {
  userId: string;
  error: string;
}

export async function linkFplAccount(userId: string, fplEntryId: number) {
  const manager = await FPLService.getManager(fplEntryId);
  return prisma.fPLAccount.upsert({
    where: { userId },
    create: {
      userId,
      fplEntryId,
      fplTeamName: manager.name,
      fplManagerName: `${manager.player_first_name} ${manager.player_last_name}`,
    },
    update: {
      fplEntryId,
      fplTeamName: manager.name,
      fplManagerName: `${manager.player_first_name} ${manager.player_last_name}`,
      linkedAt: new Date(),
    },
  });
}

export async function unlinkFplAccount(userId: string) {
  await prisma.fPLAccount.delete({ where: { userId } });
}

/**
 * Syncs Game Week points for a Game Week's locked participants. Skips anyone
 * whose current snapshot came from a manual correction (submitManualScore)
 * unless a specific userId is passed — that's an explicit admin retry for
 * that one person, which is allowed to overwrite it.
 */
export async function syncGameWeekScores(gameWeekId: string, options?: { userId?: string }) {
  const gameWeek = await prisma.gameWeek.findUnique({
    where: { id: gameWeekId },
    include: {
      participants: { include: { user: { include: { fplAccount: true } } } },
    },
  });
  if (!gameWeek) throw new Error("Game Week not found");

  const targets = options?.userId
    ? gameWeek.participants.filter((participant) => participant.userId === options.userId)
    : gameWeek.participants;

  let succeeded = 0;
  const failed: SyncFailure[] = [];

  for (const participant of targets) {
    const fplAccount = participant.user.fplAccount;
    if (!fplAccount) {
      failed.push({ userId: participant.userId, error: "No linked FPL account" });
      continue;
    }

    if (!options?.userId) {
      const existing = await prisma.fPLGameWeekSnapshot.findUnique({
        where: { gameWeekId_userId: { gameWeekId, userId: participant.userId } },
      });
      if (existing?.source === "MANUAL") continue;
    }

    try {
      const points = await FPLService.getManagerGameWeekPoints(fplAccount.fplEntryId, gameWeek.fplEventId);
      await prisma.fPLGameWeekSnapshot.upsert({
        where: { gameWeekId_userId: { gameWeekId, userId: participant.userId } },
        create: {
          gameWeekId,
          userId: participant.userId,
          fplEntryId: fplAccount.fplEntryId,
          points,
          source: "API",
        },
        update: { points, source: "API", correctionReason: null, syncedAt: new Date() },
      });
      await prisma.fPLAccount.update({
        where: { userId: participant.userId },
        data: { lastSyncedAt: new Date() },
      });
      succeeded++;
    } catch (error) {
      failed.push({
        userId: participant.userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { succeeded, failed };
}

interface SubmitManualScoreInput {
  gameWeekId: string;
  userId: string;
  points: number;
  reason: string;
}

/** Always-audited manual override for when the FPL API is down or wrong. */
export async function submitManualScore(input: SubmitManualScoreInput, actor: SyncActor) {
  const [existing, fplAccount] = await Promise.all([
    prisma.fPLGameWeekSnapshot.findUnique({
      where: { gameWeekId_userId: { gameWeekId: input.gameWeekId, userId: input.userId } },
    }),
    prisma.fPLAccount.findUnique({ where: { userId: input.userId } }),
  ]);
  const fplEntryId = existing?.fplEntryId ?? fplAccount?.fplEntryId ?? 0;

  const snapshot = await prisma.fPLGameWeekSnapshot.upsert({
    where: { gameWeekId_userId: { gameWeekId: input.gameWeekId, userId: input.userId } },
    create: {
      gameWeekId: input.gameWeekId,
      userId: input.userId,
      fplEntryId,
      points: input.points,
      source: "MANUAL",
      correctionReason: input.reason,
    },
    update: {
      points: input.points,
      source: "MANUAL",
      correctionReason: input.reason,
      syncedAt: new Date(),
    },
  });

  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    actorLabel: actor.label,
    action: "MANUAL_SCORE_OVERRIDE",
    entityType: "FPLGameWeekSnapshot",
    entityId: snapshot.id,
    oldValue: existing ? { points: existing.points, source: existing.source } : null,
    newValue: { points: input.points, source: "MANUAL" },
    reason: input.reason,
  });

  return snapshot;
}
