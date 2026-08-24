import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { lockGameWeek } from "@/services/lockGameWeek";
import { finalizeResults, MissingFplDataError } from "@/services/finalizeResults";
import {
  createTestUser,
  createTestGameWeek,
  createVerifiedPayment,
  cleanupTestGameWeek,
} from "@/services/gameWeekTestFixtures";

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

/**
 * Locks a Game Week (creating the real GameWeekParticipant snapshot via
 * lockGameWeek) and moves it to RESULTS_PENDING, then seeds an FPL score per
 * user. `points: null` leaves that user with no snapshot at all — the
 * "missing data" case, not a score of zero.
 */
async function setupResultsPending(
  prizePositions: { position: number; amount: number }[],
  participants: { name: string; points: number | null }[],
) {
  const users = await Promise.all(participants.map((p) => createTestUser(p.name)));
  activeUserIds = users.map((u) => u.id);
  // entryFee is generous relative to the prize amounts each test below
  // configures, so the pool is never the thing under test here.
  const entryFee = 1000;
  const gameWeek = await createTestGameWeek({ minParticipants: 1, entryFee, prizePositions });
  activeGameWeekId = gameWeek.id;
  for (const user of users) await createVerifiedPayment(gameWeek.id, user.id, entryFee);

  await lockGameWeek(gameWeek.id, { label: "TEST" });
  await prisma.gameWeek.update({ where: { id: gameWeek.id }, data: { status: "RESULTS_PENDING" } });

  for (const [index, user] of users.entries()) {
    const points = participants[index].points;
    if (points !== null) {
      await prisma.fPLGameWeekSnapshot.create({
        data: { gameWeekId: gameWeek.id, userId: user.id, fplEntryId: 1, points, source: "MANUAL" },
      });
    }
  }

  return { gameWeekId: gameWeek.id, users };
}

describe("finalizeResults", () => {
  it("refuses to finalize while any participant's score is missing (not zero)", async () => {
    const { gameWeekId, users } = await setupResultsPending(
      [{ position: 1, amount: 900 }],
      [
        { name: "Has score", points: 50 },
        { name: "Missing score", points: null },
      ],
    );

    await expect(finalizeResults(gameWeekId, { label: "TEST" })).rejects.toThrow(MissingFplDataError);

    const missingUser = users[1];
    try {
      await finalizeResults(gameWeekId, { label: "TEST" });
    } catch (error) {
      expect(error).toBeInstanceOf(MissingFplDataError);
      expect((error as MissingFplDataError).missingUserIds).toEqual([missingUser.id]);
    }

    const fresh = await prisma.gameWeek.findUniqueOrThrow({ where: { id: gameWeekId } });
    expect(fresh.status).toBe("RESULTS_PENDING");
  });

  it("proceeds when a score is legitimately zero", async () => {
    const { gameWeekId } = await setupResultsPending(
      [{ position: 1, amount: 900 }],
      [{ name: "Zero", points: 0 }],
    );

    const result = await finalizeResults(gameWeekId, { label: "TEST" });
    expect(result.status).toBe("PRIZES_PENDING");
  });

  it("splits a tie correctly and creates PrizePayment rows only for winners", async () => {
    const { gameWeekId, users } = await setupResultsPending(
      [
        { position: 1, amount: 900 },
        { position: 2, amount: 450 },
        { position: 3, amount: 150 },
      ],
      [
        { name: "TiedFirstA", points: 78 },
        { name: "TiedFirstB", points: 78 },
        { name: "Third", points: 71 },
      ],
    );

    await finalizeResults(gameWeekId, { label: "TEST" });

    const results = await prisma.gameWeekResult.findMany({
      where: { gameWeekId },
      include: { prizePayment: true },
      orderBy: { rank: "asc" },
    });
    expect(results).toHaveLength(3);

    const [firstA, firstB] = results.filter((r) => r.rank === 1);
    expect(firstA.prizeAwarded.toString()).toBe("675");
    expect(firstB.prizeAwarded.toString()).toBe("675");
    expect(firstA.prizePayment).not.toBeNull();
    expect(firstA.prizePayment?.status).toBe("PENDING");

    const third = results.find((r) => r.rank === 3)!;
    expect(third.prizeAwarded.toString()).toBe("150");
    expect(third.userId).toBe(users[2].id);

    const gameWeek = await prisma.gameWeek.findUniqueOrThrow({ where: { id: gameWeekId } });
    expect(gameWeek.status).toBe("PRIZES_PENDING");
  });

  it("rejects finalizing the same Game Week twice", async () => {
    const { gameWeekId } = await setupResultsPending([{ position: 1, amount: 900 }], [{ name: "Solo", points: 40 }]);

    await finalizeResults(gameWeekId, { label: "TEST" });

    await expect(finalizeResults(gameWeekId, { label: "TEST" })).rejects.toThrow(/RESULTS_PENDING/);
  });
});
