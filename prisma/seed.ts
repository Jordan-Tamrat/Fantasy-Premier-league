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
      leagueName: "Ethiosinia Fantasy Premium League (DEMO)",
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

  // --- Phase 2 demo data: rules, an announcement, a live vote, some chat ---

  if ((await prisma.ruleSection.count()) === 0) {
    const rules = [
      ["Entry Fee & Payment Deadline", "Each Game Week has an entry fee set by the admin. Payment must be made and verified before the payment deadline, which is 2 hours before the FPL deadline."],
      ["Proof of Payment", "Every payment must include a screenshot. The admin verifies each one before you are counted as a participant."],
      ["Game Week Scoring", "Only your FPL points for that specific Game Week count. Your overall season total is never used to decide a weekly winner."],
      ["Prize Money", "The prize pool is the total of all verified entry fees. The admin sets the amount for each prize position, and the total can never exceed the pool."],
      ["Tie-Breaking", "Players who tie share every prize position their tie covers, split equally. Two players tied for 1st split the 1st and 2nd prizes, and the next player is ranked 3rd — there is no 2nd place."],
      ["Rule Changes", "Any member can propose a rule change. Every active member gets one vote, and a simple majority passes it."],
      ["Disputes", "If something looks wrong, raise a dispute. The admin must respond, and every action is recorded in the audit log."],
    ];
    for (const [index, [title, body]] of rules.entries()) {
      await prisma.ruleSection.create({ data: { title, body, order: index + 1 } });
    }
  }

  if ((await prisma.announcement.count()) === 0) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to the new league app (DEMO)",
        body: "Payments, results and prize money all live here now. Chat is on the Chat tab — Telegram is officially retired.",
        authorId: admin.id,
      },
    });
  }

  if ((await prisma.proposal.count()) === 0) {
    const proposal = await prisma.proposal.create({
      data: {
        title: "Increase entry fee to 150 ETB",
        description: "Bigger pot, bigger prizes. Proposed starting from next Game Week.",
        authorId: members[1].id,
        votingDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });
    for (const [index, member] of members.slice(0, 5).entries()) {
      await prisma.vote.create({
        data: { proposalId: proposal.id, userId: member.id, choice: index < 3 ? "YES" : "NO" },
      });
    }
  }

  if ((await prisma.chatMessage.count()) === 0) {
    await prisma.chatMessage.create({
      data: { type: "SYSTEM", content: "🏆 Game Week 1 results are final.  🥇 Mube — 675.00  ·  🥇 Jordan — 675.00  ·  🥉 Yoseph — 150.00" },
    });
    await prisma.chatMessage.create({
      data: { senderId: members[0].id, content: "Good week everyone 😄" },
    });
    await prisma.chatMessage.create({
      data: { senderId: members[2].id, content: "Robbed by the captain pick again..." },
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
