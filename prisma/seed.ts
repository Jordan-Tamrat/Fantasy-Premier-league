/**
 * Development seed data — clearly fake, never run against production.
 * Creates one admin (from ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME env vars),
 * a handful of demo members, league settings, and one COMPLETED Game Week
 * with a two-way tie so the tie-splitting math is visible end to end.
 */
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { calculatePrizeDistribution } from "../services/prizeEngine";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me-before-seeding";
  const adminName = process.env.ADMIN_NAME ?? "League Admin";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
    },
  });

  await prisma.leagueSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      leagueName: "Ethiosinia Fantasy League (DEMO)",
      currency: "ETB",
      defaultEntryFee: 100,
      defaultPaymentDeadlineOffsetHours: 2,
      defaultMinParticipants: 3,
      leagueTelebirrNumber: "0900000000",
      leagueCbeAccountNumber: "1000000000000",
      leagueAccountName: adminName,
    },
  });

  const demoMemberNames = ["Mube", "Jordan", "Yoseph", "Abel", "Sara", "Kalkidan", "Nahom", "Bethel"];
  const members = [];
  for (const name of demoMemberNames) {
    const email = `${name.toLowerCase()}@demo.local`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        passwordHash: await bcrypt.hash("password123", 12),
        role: "MEMBER",
      },
    });
    members.push(user);
  }

  // One completed Game Week demonstrating the exact spec §99 scenario: a
  // two-way tie for 1st splits the 1st+2nd prize; 3rd place gets 3rd prize.
  const existingDemoGw = await prisma.gameWeek.findUnique({ where: { fplEventId: 1 } });
  if (!existingDemoGw) {
    const fplDeadline = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const paymentDeadline = new Date(fplDeadline.getTime() - 2 * 60 * 60 * 1000);

    const gameWeek = await prisma.gameWeek.create({
      data: {
        fplEventId: 1,
        status: "LOCKED",
        entryFee: 100,
        minParticipants: 3,
        paymentDeadlineOffsetHours: 2,
        fplDeadline,
        paymentDeadline,
        lockedAt: paymentDeadline,
        prizeConfigFrozenAt: paymentDeadline,
        collectedAmountSnapshot: 500,
        prizePositions: {
          create: [
            { position: 1, amount: 900 },
            { position: 2, amount: 450 },
            { position: 3, amount: 150 },
          ],
        },
      },
    });

    const participants = members.slice(0, 5);
    const scores = [78, 78, 71, 68, 60]; // Mube & Jordan tie for 1st

    for (const [i, user] of participants.entries()) {
      const payment = await prisma.payment.create({
        data: {
          gameWeekId: gameWeek.id,
          userId: user.id,
          amount: 100,
          method: i % 2 === 0 ? "TELEBIRR" : "CBE",
          screenshotPath: `demo/${gameWeek.id}/${user.id}/seed.png`,
          status: "VERIFIED",
          verifiedAt: new Date(),
          verifiedByUserId: admin.id,
        },
      });
      await prisma.gameWeekParticipant.create({
        data: {
          gameWeekId: gameWeek.id,
          userId: user.id,
          paymentId: payment.id,
          entryFeePaidSnapshot: 100,
        },
      });
      await prisma.fPLGameWeekSnapshot.create({
        data: {
          gameWeekId: gameWeek.id,
          userId: user.id,
          fplEntryId: 1000000 + i,
          points: scores[i],
          source: "MANUAL",
          correctionReason: "Demo seed data",
        },
      });
    }

    const awards = calculatePrizeDistribution(
      participants.map((user, i) => ({ userId: user.id, points: scores[i] })),
      [
        { position: 1, amount: 900 },
        { position: 2, amount: 450 },
        { position: 3, amount: 150 },
      ],
    );

    for (const award of awards) {
      const result = await prisma.gameWeekResult.create({
        data: {
          gameWeekId: gameWeek.id,
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
        await prisma.prizePayment.create({
          data: {
            gameWeekResultId: result.id,
            amount: award.prizeAwarded,
            status: "PAID",
            method: "TELEBIRR",
            paidAt: new Date(),
            paidByUserId: admin.id,
          },
        });
      }
    }

    await prisma.gameWeek.update({
      where: { id: gameWeek.id },
      data: { status: "COMPLETED", finalizedAt: new Date() },
    });
  }

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Demo member login: <name>@demo.local / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
