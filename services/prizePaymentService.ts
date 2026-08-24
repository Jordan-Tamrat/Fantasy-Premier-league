import { prisma } from "@/lib/prisma";
import { buildProofPath, uploadProofImage, STORAGE_BUCKETS } from "@/lib/storage";
import { writeAuditLog } from "@/services/auditService";

interface MarkPaidInput {
  prizePaymentId: string;
  method: "TELEBIRR" | "CBE";
  referenceNumber?: string;
  notes?: string;
  proof?: File;
}

interface Actor {
  userId: string;
}

/** Marks one prize paid; once every prize for a Game Week is paid, the Game Week auto-completes. */
export async function markPrizePaymentPaid(input: MarkPaidInput, actor: Actor) {
  const prizePayment = await prisma.prizePayment.findUnique({
    where: { id: input.prizePaymentId },
    include: { gameWeekResult: true },
  });
  if (!prizePayment) throw new Error("Prize payment not found");
  if (prizePayment.status === "PAID") return prizePayment;

  let proofPath: string | undefined;
  if (input.proof) {
    proofPath = buildProofPath(
      prizePayment.gameWeekResult.gameWeekId,
      prizePayment.gameWeekResult.userId,
      input.proof.name,
    );
    await uploadProofImage(STORAGE_BUCKETS.prizePaymentProofs, proofPath, input.proof);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.prizePayment.update({
      where: { id: input.prizePaymentId },
      data: {
        status: "PAID",
        method: input.method,
        paidAt: new Date(),
        paidByUserId: actor.userId,
        referenceNumber: input.referenceNumber || null,
        notes: input.notes || null,
        proofPath: proofPath ?? prizePayment.proofPath,
      },
    });

    await writeAuditLog(tx, {
      actorUserId: actor.userId,
      action: "PRIZE_PAYMENT_MARKED_PAID",
      entityType: "PrizePayment",
      entityId: input.prizePaymentId,
      newValue: { amount: prizePayment.amount.toFixed(2), method: input.method },
    });

    const gameWeekId = prizePayment.gameWeekResult.gameWeekId;
    const remainingUnpaid = await tx.prizePayment.count({
      where: { gameWeekResult: { gameWeekId }, status: { not: "PAID" } },
    });
    if (remainingUnpaid === 0) {
      await tx.gameWeek.update({ where: { id: gameWeekId }, data: { status: "COMPLETED" } });
      await writeAuditLog(tx, {
        actorUserId: actor.userId,
        action: "GAMEWEEK_COMPLETED",
        entityType: "GameWeek",
        entityId: gameWeekId,
      });
    }

    return updated;
  });
}
