import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { lockGameWeek } from "@/services/lockGameWeek";
import {
  createTestUser,
  createTestGameWeek,
  createVerifiedPayment,
  cleanupTestGameWeek,
} from "@/services/gameWeekTestFixtures";

// Runs against the real dev database (see vitest.setup.ts) rather than a
// mock — lockGameWeek's correctness hinges on transactional behavior that's
// not meaningful to fake. Every test cleans up fully via afterEach.

let activeGameWeekId: string | null = null;
let activeUserIds: string[] = [];

afterEach(async () => {
  if (activeGameWeekId) {
    const gw = await prisma.gameWeek.findUnique({ where: { id: activeGameWeekId }, select: { fplEventId: true } });
    if (gw) await cleanupTestGameWeek({ id: activeGameWeekId, fplEventId: gw.fplEventId }, activeUserIds);
  }
  activeGameWeekId = null;
  activeUserIds = [];
});

describe("lockGameWeek", () => {
  it("locks when verifiedCount exactly equals minParticipants", async () => {
    const users = await Promise.all([createTestUser("A"), createTestUser("B"), createTestUser("C")]);
    activeUserIds = users.map((u) => u.id);
    const gameWeek = await createTestGameWeek({ minParticipants: 3, entryFee: 100 });
    activeGameWeekId = gameWeek.id;
    for (const user of users) await createVerifiedPayment(gameWeek.id, user.id, 100);

    const result = await lockGameWeek(gameWeek.id, { label: "TEST" });

    expect(result.status).toBe("LOCKED");
    expect(result.collectedAmountSnapshot?.toString()).toBe("300");
    const participants = await prisma.gameWeekParticipant.findMany({ where: { gameWeekId: gameWeek.id } });
    expect(participants).toHaveLength(3);
    expect(new Set(participants.map((p) => p.userId))).toEqual(new Set(activeUserIds));
  });

  it("cancels when verifiedCount is one less than minParticipants, but still records the collected amount", async () => {
    const users = await Promise.all([createTestUser("A"), createTestUser("B")]);
    activeUserIds = users.map((u) => u.id);
    const gameWeek = await createTestGameWeek({ minParticipants: 3, entryFee: 100 });
    activeGameWeekId = gameWeek.id;
    for (const user of users) await createVerifiedPayment(gameWeek.id, user.id, 100);

    const result = await lockGameWeek(gameWeek.id, { label: "TEST" });

    expect(result.status).toBe("CANCELLED");
    expect(result.collectedAmountSnapshot?.toString()).toBe("200");
    const participants = await prisma.gameWeekParticipant.findMany({ where: { gameWeekId: gameWeek.id } });
    expect(participants).toHaveLength(0);
  });

  it("refuses to lock a Game Week that isn't PAYMENT_CLOSED", async () => {
    const gameWeek = await createTestGameWeek({ status: "OPEN" });
    activeGameWeekId = gameWeek.id;

    await expect(lockGameWeek(gameWeek.id, { label: "TEST" })).rejects.toThrow(/PAYMENT_CLOSED/);
  });

  it("aborts rather than lock if configured prizes exceed the collected amount", async () => {
    const user = await createTestUser("A");
    activeUserIds = [user.id];
    const gameWeek = await createTestGameWeek({
      minParticipants: 1,
      entryFee: 100,
      prizePositions: [{ position: 1, amount: 200 }],
    });
    activeGameWeekId = gameWeek.id;
    await createVerifiedPayment(gameWeek.id, user.id, 100);

    await expect(lockGameWeek(gameWeek.id, { label: "TEST" })).rejects.toThrow(/exceed/);

    // The abort must roll back the whole transaction — no partial lock.
    const fresh = await prisma.gameWeek.findUniqueOrThrow({ where: { id: gameWeek.id } });
    expect(fresh.status).toBe("PAYMENT_CLOSED");
  });
});
