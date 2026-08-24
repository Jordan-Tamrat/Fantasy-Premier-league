import { prisma } from "@/lib/prisma";
import { buildProofPath, uploadProofImage, STORAGE_BUCKETS } from "@/lib/storage";
import { writeAuditLog } from "@/services/auditService";
import { notifyUsers } from "@/services/notificationService";

interface SubmitPaymentInput {
  gameWeekId: string;
  userId: string;
  method: "TELEBIRR" | "CBE";
  screenshot: File;
}

export async function submitPayment(input: SubmitPaymentInput) {
  const gameWeek = await prisma.gameWeek.findUnique({ where: { id: input.gameWeekId } });
  if (!gameWeek) throw new Error("Game Week not found");
  if (gameWeek.status !== "OPEN") {
    throw new Error(`Payments are not being accepted for this Game Week right now (status: ${gameWeek.status})`);
  }

  const existing = await prisma.payment.findUnique({
    where: { gameWeekId_userId: { gameWeekId: input.gameWeekId, userId: input.userId } },
  });
  if (existing && existing.status !== "REJECTED") {
    throw new Error("You have already submitted a payment for this Game Week");
  }

  const path = buildProofPath(input.gameWeekId, input.userId, input.screenshot.name);
  await uploadProofImage(STORAGE_BUCKETS.paymentProofs, path, input.screenshot);

  // A prior submission was rejected — this resubmits rather than creating a
  // second row, since (gameWeekId, userId) is unique.
  if (existing) {
    return prisma.payment.update({
      where: { id: existing.id },
      data: {
        amount: gameWeek.entryFee,
        method: input.method,
        screenshotPath: path,
        status: "PENDING",
        rejectionReason: null,
        submittedAt: new Date(),
      },
    });
  }

  return prisma.payment.create({
    data: {
      gameWeekId: input.gameWeekId,
      userId: input.userId,
      amount: gameWeek.entryFee,
      method: input.method,
      screenshotPath: path,
      status: "PENDING",
    },
  });
}

interface Actor {
  userId: string;
}

export async function verifyPayment(paymentId: string, actor: Actor) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { gameWeek: true } });
    if (!payment) throw new Error("Payment not found");
    if (payment.gameWeek.status !== "OPEN" && payment.gameWeek.status !== "PAYMENT_CLOSED") {
      throw new Error(`Cannot verify a payment once the Game Week is ${payment.gameWeek.status}`);
    }
    if (payment.status === "VERIFIED") return payment;

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        verifiedByUserId: actor.userId,
        rejectionReason: null,
      },
    });

    await writeAuditLog(tx, {
      actorUserId: actor.userId,
      action: "PAYMENT_VERIFIED",
      entityType: "Payment",
      entityId: paymentId,
      oldValue: { status: payment.status },
      newValue: { status: "VERIFIED" },
    });

    await notifyUsers(tx, [payment.userId], {
      type: "PAYMENT_VERIFIED",
      title: `Payment verified for Game Week ${payment.gameWeek.fplEventId}`,
      body: "You're in — good luck!",
      href: `/gameweeks/${payment.gameWeekId}`,
    });

    return updated;
  });
}

export async function rejectPayment(paymentId: string, reason: string, actor: Actor) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { gameWeek: true } });
    if (!payment) throw new Error("Payment not found");
    if (payment.gameWeek.status !== "OPEN" && payment.gameWeek.status !== "PAYMENT_CLOSED") {
      throw new Error(`Cannot reject a payment once the Game Week is ${payment.gameWeek.status}`);
    }

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        verifiedAt: null,
        verifiedByUserId: null,
      },
    });

    await writeAuditLog(tx, {
      actorUserId: actor.userId,
      action: "PAYMENT_REJECTED",
      entityType: "Payment",
      entityId: paymentId,
      oldValue: { status: payment.status },
      newValue: { status: "REJECTED" },
      reason,
    });

    await notifyUsers(tx, [payment.userId], {
      type: "PAYMENT_REJECTED",
      title: `Payment rejected for Game Week ${payment.gameWeek.fplEventId}`,
      body: reason,
      href: `/gameweeks/${payment.gameWeekId}`,
    });

    return updated;
  });
}
