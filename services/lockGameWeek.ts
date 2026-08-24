import { prisma } from "@/lib/prisma";
import { sumDecimal, decimal } from "@/lib/money";
import { writeAuditLog } from "@/services/auditService";
import { notifyEveryone } from "@/services/notificationService";
import { postSystemMessage } from "@/services/chatService";

interface LockGameWeekActor {
  userId?: string;
  label?: string;
}

/**
 * Freezes who's eligible for this Game Week's prizes. Reads every VERIFIED
 * payment at this instant, snapshots it into GameWeekParticipant (a separate,
 * immutable table from the mutable Payment record — see prisma/schema.prisma),
 * and freezes the prize configuration. If fewer than minParticipants paid,
 * the Game Week is cancelled instead — no participants, no prize freeze, but
 * the collected amount is still recorded for manual refunds.
 */
export async function lockGameWeek(gameWeekId: string, actor: LockGameWeekActor) {
  return prisma.$transaction(async (tx) => {
    const gameWeek = await tx.gameWeek.findUnique({
      where: { id: gameWeekId },
      include: { prizePositions: true },
    });
    if (!gameWeek) throw new Error("Game Week not found");
    if (gameWeek.status !== "PAYMENT_CLOSED") {
      throw new Error(`Cannot lock a Game Week in status ${gameWeek.status} (must be PAYMENT_CLOSED)`);
    }

    const verifiedPayments = await tx.payment.findMany({
      where: { gameWeekId, status: "VERIFIED" },
    });

    if (verifiedPayments.length < gameWeek.minParticipants) {
      const collectedAmount = decimal(gameWeek.entryFee).times(verifiedPayments.length);
      const cancelled = await tx.gameWeek.update({
        where: { id: gameWeekId },
        data: { status: "CANCELLED", collectedAmountSnapshot: collectedAmount },
      });
      await writeAuditLog(tx, {
        actorUserId: actor.userId,
        actorLabel: actor.label,
        action: "GAMEWEEK_CANCELLED",
        entityType: "GameWeek",
        entityId: gameWeekId,
        newValue: { verifiedCount: verifiedPayments.length, minParticipants: gameWeek.minParticipants },
        reason: "Fewer verified payments than the configured minimum participants",
      });
      return cancelled;
    }

    const collectedAmount = decimal(gameWeek.entryFee).times(verifiedPayments.length);
    const totalPrizes = sumDecimal(gameWeek.prizePositions.map((p) => p.amount));
    if (totalPrizes.greaterThan(collectedAmount)) {
      // Already validated when prizes were configured — this only fires if
      // verified payments dropped between then and now (e.g. an admin
      // un-verified one). Abort rather than lock with impossible math.
      throw new Error(
        `Configured prizes (${totalPrizes.toFixed(2)}) exceed the collected amount (${collectedAmount.toFixed(2)})`,
      );
    }

    await tx.gameWeekParticipant.createMany({
      data: verifiedPayments.map((payment) => ({
        gameWeekId,
        userId: payment.userId,
        paymentId: payment.id,
        entryFeePaidSnapshot: payment.amount,
      })),
    });

    const locked = await tx.gameWeek.update({
      where: { id: gameWeekId },
      data: {
        status: "LOCKED",
        lockedAt: new Date(),
        prizeConfigFrozenAt: new Date(),
        collectedAmountSnapshot: collectedAmount,
      },
    });

    await writeAuditLog(tx, {
      actorUserId: actor.userId,
      actorLabel: actor.label,
      action: "GAMEWEEK_LOCKED",
      entityType: "GameWeek",
      entityId: gameWeekId,
      newValue: {
        verifiedCount: verifiedPayments.length,
        collectedAmount: collectedAmount.toFixed(2),
        participantUserIds: verifiedPayments.map((p) => p.userId),
      },
    });

    await postSystemMessage(
      tx,
      `🔒 Game Week ${locked.fplEventId} participation is locked — ${verifiedPayments.length} players, ${collectedAmount.toFixed(2)} in the pot.`,
    );
    await notifyEveryone(tx, {
      type: "GAMEWEEK_LOCKED",
      title: `Game Week ${locked.fplEventId} is locked`,
      body: `${verifiedPayments.length} players are competing for ${collectedAmount.toFixed(2)}.`,
      href: `/gameweeks/${gameWeekId}`,
    });

    return locked;
  });
}
