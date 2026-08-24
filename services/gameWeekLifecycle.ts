import { prisma } from "@/lib/prisma";
import { FPLService } from "@/lib/fpl";
import { decimal, sumDecimal } from "@/lib/money";
import { writeAuditLog } from "@/services/auditService";

interface Actor {
  userId: string;
}

interface CreateGameWeekInput {
  fplEventId: number;
  entryFee: number;
  minParticipants: number;
  paymentDeadlineOffsetHours: number;
  announcement?: string;
}

export async function createGameWeek(input: CreateGameWeekInput, actor: Actor) {
  const fplEvent = await FPLService.getEventById(input.fplEventId);
  if (!fplEvent) throw new Error(`FPL Game Week ${input.fplEventId} was not found`);

  const fplDeadline = new Date(fplEvent.deadline_time);
  const paymentDeadline = new Date(fplDeadline.getTime() - input.paymentDeadlineOffsetHours * 60 * 60 * 1000);

  const gameWeek = await prisma.gameWeek.create({
    data: {
      fplEventId: input.fplEventId,
      entryFee: decimal(input.entryFee),
      minParticipants: input.minParticipants,
      paymentDeadlineOffsetHours: input.paymentDeadlineOffsetHours,
      fplDeadline,
      paymentDeadline,
      announcement: input.announcement,
      status: "DRAFT",
    },
  });

  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "GAMEWEEK_CREATED",
    entityType: "GameWeek",
    entityId: gameWeek.id,
    newValue: { fplEventId: input.fplEventId, entryFee: input.entryFee },
  });

  return gameWeek;
}

/** Only allowed while the config isn't frozen yet — see lockGameWeek.ts. */
export async function openGameWeek(gameWeekId: string, actor: Actor) {
  const gameWeek = await prisma.gameWeek.findUnique({ where: { id: gameWeekId } });
  if (!gameWeek) throw new Error("Game Week not found");
  if (gameWeek.status !== "DRAFT") {
    throw new Error(`Cannot open a Game Week in status ${gameWeek.status} (must be DRAFT)`);
  }

  const updated = await prisma.gameWeek.update({ where: { id: gameWeekId }, data: { status: "OPEN" } });
  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "GAMEWEEK_OPENED",
    entityType: "GameWeek",
    entityId: gameWeekId,
  });
  return updated;
}

/** Closes the payment window; lockGameWeek() does the actual participant snapshot. */
export async function closePayments(gameWeekId: string, actor?: Actor) {
  const gameWeek = await prisma.gameWeek.findUnique({ where: { id: gameWeekId } });
  if (!gameWeek) throw new Error("Game Week not found");
  if (gameWeek.status !== "OPEN") {
    throw new Error(`Cannot close payments for a Game Week in status ${gameWeek.status} (must be OPEN)`);
  }

  const updated = await prisma.gameWeek.update({ where: { id: gameWeekId }, data: { status: "PAYMENT_CLOSED" } });
  await writeAuditLog(prisma, {
    actorUserId: actor?.userId,
    actorLabel: actor ? undefined : "SYSTEM_CRON",
    action: "GAMEWEEK_PAYMENT_CLOSED",
    entityType: "GameWeek",
    entityId: gameWeekId,
  });
  return updated;
}

export async function cancelGameWeek(gameWeekId: string, reason: string, actor: Actor) {
  const gameWeek = await prisma.gameWeek.findUnique({ where: { id: gameWeekId } });
  if (!gameWeek) throw new Error("Game Week not found");
  if (gameWeek.status === "COMPLETED" || gameWeek.status === "CANCELLED") {
    throw new Error(`Cannot cancel a Game Week that is already ${gameWeek.status}`);
  }

  const updated = await prisma.gameWeek.update({ where: { id: gameWeekId }, data: { status: "CANCELLED" } });
  await writeAuditLog(prisma, {
    actorUserId: actor.userId,
    action: "GAMEWEEK_CANCELLED_MANUAL",
    entityType: "GameWeek",
    entityId: gameWeekId,
    oldValue: { status: gameWeek.status },
    reason,
  });
  return updated;
}

interface PrizePositionInput {
  position: number;
  amount: number;
}

/**
 * Prizes can be freely adjusted up until the Game Week locks, since the
 * number of verified participants (and so the actual pool) isn't final
 * until then. Validates against the *current* verified count as a live
 * estimate — lockGameWeek() re-validates against the frozen amount too.
 */
export async function setPrizePositions(gameWeekId: string, positions: PrizePositionInput[], actor: Actor) {
  const gameWeek = await prisma.gameWeek.findUnique({ where: { id: gameWeekId } });
  if (!gameWeek) throw new Error("Game Week not found");
  if (gameWeek.prizeConfigFrozenAt) {
    throw new Error("Prize configuration is frozen for this Game Week");
  }
  if (gameWeek.status === "LOCKED" || gameWeek.status === "COMPLETED" || gameWeek.status === "CANCELLED") {
    throw new Error(`Cannot change prizes for a Game Week in status ${gameWeek.status}`);
  }

  const verifiedCount = await prisma.payment.count({ where: { gameWeekId, status: "VERIFIED" } });
  const estimatedPool = decimal(gameWeek.entryFee).times(verifiedCount);
  const totalPrizes = sumDecimal(positions.map((p) => p.amount));
  if (totalPrizes.greaterThan(estimatedPool)) {
    throw new Error(
      `Prize distribution (${totalPrizes.toFixed(2)}) exceeds the currently collected pool (${estimatedPool.toFixed(2)})`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.prizePosition.deleteMany({ where: { gameWeekId } });
    await tx.prizePosition.createMany({
      data: positions.map((p) => ({ gameWeekId, position: p.position, amount: decimal(p.amount) })),
    });
    await writeAuditLog(tx, {
      actorUserId: actor.userId,
      action: "PRIZE_POSITIONS_SET",
      entityType: "GameWeek",
      entityId: gameWeekId,
      newValue: { positions },
    });
  });

  return prisma.prizePosition.findMany({ where: { gameWeekId }, orderBy: { position: "asc" } });
}
