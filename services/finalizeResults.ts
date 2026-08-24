import { prisma } from "@/lib/prisma";
import { calculatePrizeDistribution } from "@/services/prizeEngine";
import { writeAuditLog } from "@/services/auditService";
import { notifyEveryone } from "@/services/notificationService";
import { postSystemMessage } from "@/services/chatService";

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

interface FinalizeActor {
  userId?: string;
  label?: string;
}

export class MissingFplDataError extends Error {
  constructor(public missingUserIds: string[]) {
    super(`Missing FPL data for ${missingUserIds.length} participant(s)`);
    this.name = "MissingFplDataError";
  }
}

/**
 * Runs the prize engine over a Game Week's locked participants and writes
 * the frozen results + pending prize payments. Refuses to run at all while
 * any participant's Game Week points are still unknown (null) — a real 0 is
 * fine, a missing score is not (see MissingFplDataError, handled by the
 * admin via syncGameWeekScores or submitManualScore in fplSyncService.ts).
 */
export async function finalizeResults(gameWeekId: string, actor: FinalizeActor) {
  const gameWeek = await prisma.gameWeek.findUnique({
    where: { id: gameWeekId },
    include: { participants: true, prizePositions: true },
  });
  if (!gameWeek) throw new Error("Game Week not found");
  if (gameWeek.status !== "RESULTS_PENDING") {
    throw new Error(`Cannot finalize a Game Week in status ${gameWeek.status} (must be RESULTS_PENDING)`);
  }

  const snapshots = await prisma.fPLGameWeekSnapshot.findMany({ where: { gameWeekId } });
  const snapshotByUserId = new Map(snapshots.map((snapshot) => [snapshot.userId, snapshot]));

  const missingUserIds = gameWeek.participants
    .filter((participant) => snapshotByUserId.get(participant.userId)?.points == null)
    .map((participant) => participant.userId);
  if (missingUserIds.length > 0) {
    throw new MissingFplDataError(missingUserIds);
  }

  const engineParticipants = gameWeek.participants.map((participant) => ({
    userId: participant.userId,
    points: snapshotByUserId.get(participant.userId)!.points!,
  }));
  const engineWithPositions = gameWeek.prizePositions.map((position) => ({
    position: position.position,
    amount: position.amount,
  }));
  const awards = calculatePrizeDistribution(engineParticipants, engineWithPositions);

  return prisma.$transaction(async (tx) => {
    const fresh = await tx.gameWeek.findUnique({ where: { id: gameWeekId } });
    if (!fresh || fresh.status !== "RESULTS_PENDING") {
      throw new Error("Game Week was already finalized or is not ready");
    }

    for (const award of awards) {
      const result = await tx.gameWeekResult.create({
        data: {
          gameWeekId,
          userId: award.userId,
          points: award.points,
          rank: award.rank,
          tieGroupSize: award.tieGroupSize,
          prizePositionsConsumed: award.prizePositionsConsumed,
          prizeAwarded: award.prizeAwarded,
          roundingAdjustment: award.roundingAdjustment,
        },
      });
      if (award.prizeAwarded.greaterThan(0)) {
        await tx.prizePayment.create({
          data: { gameWeekResultId: result.id, amount: award.prizeAwarded },
        });
      }
    }

    const updated = await tx.gameWeek.update({
      where: { id: gameWeekId },
      data: { status: "PRIZES_PENDING", finalizedAt: new Date() },
    });

    await writeAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "GAMEWEEK_FINALIZED",
      entityType: "GameWeek",
      entityId: gameWeekId,
      newValue: {
        awards: awards.map((award) => ({
          userId: award.userId,
          rank: award.rank,
          prizeAwarded: award.prizeAwarded.toFixed(2),
        })),
      },
    });

    // Announce the winners by name, so the chat reads the way the Telegram
    // group used to.
    const winners = awards.filter((a) => a.prizeAwarded.greaterThan(0));
    const nameById = new Map(
      (await tx.user.findMany({ where: { id: { in: winners.map((w) => w.userId) } }, select: { id: true, name: true } })).map(
        (u) => [u.id, u.name],
      ),
    );
    const winnerLine = winners
      .map((w) => `${medal(w.rank)} ${nameById.get(w.userId) ?? "Unknown"} — ${w.prizeAwarded.toFixed(2)}`)
      .join("  ·  ");

    await postSystemMessage(
      tx,
      `🏆 Game Week ${updated.fplEventId} results are final.${winnerLine ? `  ${winnerLine}` : ""}`,
    );
    await notifyEveryone(tx, {
      type: "RESULTS_FINAL",
      title: `Game Week ${updated.fplEventId} results are final`,
      body: winnerLine || undefined,
      href: `/gameweeks/${gameWeekId}`,
    });

    return updated;
  });
}
