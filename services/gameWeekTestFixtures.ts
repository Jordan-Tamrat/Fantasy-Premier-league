import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { GameWeekStatus } from "@/lib/generated/prisma/client";

/**
 * Test-only helpers for lockGameWeek.test.ts / finalizeResults.test.ts.
 * These run against the real dev database (see vitest.setup.ts) rather than
 * a mock, so every fixture is built to clean up completely after itself —
 * this is a shared dev DB with real seeded data, not a disposable test DB.
 */

// FPL Game Weeks only ever number 1-38, so anything up in this range can
// never collide with real data or with another test run.
function testFplEventId(): number {
  return 900_000 + Math.floor(Math.random() * 90_000);
}

export async function createTestUser(name: string) {
  return prisma.user.create({
    data: {
      email: `test-${randomUUID()}@test.local`,
      name,
      passwordHash: "not-a-real-hash",
      role: "MEMBER",
    },
  });
}

export async function createTestGameWeek(overrides: {
  status?: GameWeekStatus;
  entryFee?: number;
  minParticipants?: number;
  prizePositions?: { position: number; amount: number }[];
}) {
  return prisma.gameWeek.create({
    data: {
      fplEventId: testFplEventId(),
      status: overrides.status ?? "PAYMENT_CLOSED",
      entryFee: overrides.entryFee ?? 100,
      minParticipants: overrides.minParticipants ?? 3,
      paymentDeadlineOffsetHours: 2,
      fplDeadline: new Date(),
      paymentDeadline: new Date(),
      prizePositions: overrides.prizePositions
        ? { create: overrides.prizePositions }
        : undefined,
    },
  });
}

export async function createVerifiedPayment(gameWeekId: string, userId: string, amount = 100) {
  return prisma.payment.create({
    data: {
      gameWeekId,
      userId,
      amount,
      method: "TELEBIRR",
      screenshotPath: "test/fixture.png",
      status: "VERIFIED",
      verifiedAt: new Date(),
    },
  });
}

export async function lockAsFixture(gameWeekId: string, userIds: string[]) {
  for (const userId of userIds) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { gameWeekId_userId: { gameWeekId, userId } } });
    await prisma.gameWeekParticipant.create({
      data: { gameWeekId, userId, paymentId: payment.id, entryFeePaidSnapshot: payment.amount },
    });
  }
}

/**
 * Deletes every row a test fixture could have created, in FK-safe order.
 *
 * lockGameWeek/finalizeResults also fan out real side effects to every
 * active user — a system chat message and a Notification for each member —
 * since this is a live shared dev database (not a disposable test DB), those
 * get cleaned up too, matched by the test Game Week's fplEventId showing up
 * in the notification href / system message text.
 */
export async function cleanupTestGameWeek(gameWeek: { id: string; fplEventId: number }, userIds: string[]) {
  const gameWeekId = gameWeek.id;
  const results = await prisma.gameWeekResult.findMany({ where: { gameWeekId }, select: { id: true } });
  const resultIds = results.map((r) => r.id);

  if (resultIds.length > 0) {
    await prisma.prizePayment.deleteMany({ where: { gameWeekResultId: { in: resultIds } } });
  }
  await prisma.gameWeekResult.deleteMany({ where: { gameWeekId } });
  await prisma.fPLGameWeekSnapshot.deleteMany({ where: { gameWeekId } });
  await prisma.payment.deleteMany({ where: { gameWeekId } });
  await prisma.gameWeekParticipant.deleteMany({ where: { gameWeekId } });
  await prisma.prizePosition.deleteMany({ where: { gameWeekId } });
  await prisma.auditLog.deleteMany({ where: { entityType: "GameWeek", entityId: gameWeekId } });
  await prisma.chatMessage.deleteMany({
    where: { OR: [{ senderId: { in: userIds } }, { senderId: null, content: { contains: `Game Week ${gameWeek.fplEventId}` } }] },
  });
  await prisma.notification.deleteMany({ where: { href: `/gameweeks/${gameWeekId}` } });
  await prisma.gameWeek.delete({ where: { id: gameWeekId } });
  if (userIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}
