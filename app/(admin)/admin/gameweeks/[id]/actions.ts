"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { openGameWeek, closePayments, cancelGameWeek, setPrizePositions } from "@/services/gameWeekLifecycle";
import { lockGameWeek } from "@/services/lockGameWeek";
import { finalizeResults, MissingFplDataError } from "@/services/finalizeResults";
import { verifyPayment, rejectPayment } from "@/services/paymentService";
import { syncGameWeekScores, submitManualScore } from "@/services/fplSyncService";
import { markPrizePaymentPaid } from "@/services/prizePaymentService";
import { setPrizePositionsSchema } from "@/lib/validations/prizePosition.schema";
import { rejectPaymentSchema } from "@/lib/validations/payment.schema";
import { submitManualScoreSchema } from "@/lib/validations/manualScore.schema";
import { markPrizePaymentPaidSchema } from "@/lib/validations/prizePayment.schema";

function revalidateGameWeek(gameWeekId: string) {
  revalidatePath(`/admin/gameweeks/${gameWeekId}`);
  revalidatePath("/admin/gameweeks");
  revalidatePath("/admin/dashboard");
}

export async function openGameWeekAction(gameWeekId: string) {
  const admin = await requireAdmin();
  await openGameWeek(gameWeekId, { userId: admin.id });
  revalidateGameWeek(gameWeekId);
}

export async function closePaymentsAction(gameWeekId: string) {
  const admin = await requireAdmin();
  await closePayments(gameWeekId, { userId: admin.id });
  revalidateGameWeek(gameWeekId);
}

export async function lockGameWeekAction(gameWeekId: string, _prevState: string | undefined) {
  const admin = await requireAdmin();
  try {
    await lockGameWeek(gameWeekId, { userId: admin.id });
  } catch (error) {
    return error instanceof Error ? error.message : "Could not lock this Game Week";
  }
  revalidateGameWeek(gameWeekId);
}

export async function finalizeResultsAction(gameWeekId: string, _prevState: string | undefined) {
  const admin = await requireAdmin();
  try {
    await finalizeResults(gameWeekId, { userId: admin.id });
  } catch (error) {
    if (error instanceof MissingFplDataError) {
      return `Missing FPL data for ${error.missingUserIds.length} participant(s) — sync or enter their score manually below.`;
    }
    return error instanceof Error ? error.message : "Could not finalize results";
  }
  revalidateGameWeek(gameWeekId);
}

export async function cancelGameWeekAction(gameWeekId: string, _prevState: string | undefined, formData: FormData) {
  const admin = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return "A reason is required";
  try {
    await cancelGameWeek(gameWeekId, reason, { userId: admin.id });
  } catch (error) {
    return error instanceof Error ? error.message : "Could not cancel this Game Week";
  }
  revalidateGameWeek(gameWeekId);
}

export async function setPrizePositionsAction(gameWeekId: string, _prevState: string | undefined, formData: FormData) {
  const admin = await requireAdmin();
  const positions = [1, 2, 3]
    .map((position) => ({ position, amount: formData.get(`amount_${position}`) }))
    .filter((p) => p.amount !== null && p.amount !== "");

  const parsed = setPrizePositionsSchema.safeParse({ gameWeekId, positions });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid prize amounts";

  try {
    await setPrizePositions(gameWeekId, parsed.data.positions, { userId: admin.id });
  } catch (error) {
    return error instanceof Error ? error.message : "Could not save prize positions";
  }
  revalidateGameWeek(gameWeekId);
  return "Saved";
}

export async function verifyPaymentAction(gameWeekId: string, paymentId: string) {
  const admin = await requireAdmin();
  await verifyPayment(paymentId, { userId: admin.id });
  revalidateGameWeek(gameWeekId);
}

export async function rejectPaymentAction(
  gameWeekId: string,
  paymentId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const admin = await requireAdmin();
  const parsed = rejectPaymentSchema.safeParse({ paymentId, reason: formData.get("reason") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "A reason is required";

  await rejectPayment(paymentId, parsed.data.reason, { userId: admin.id });
  revalidateGameWeek(gameWeekId);
}

export async function retrySyncOneAction(
  gameWeekId: string,
  userId: string,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const { succeeded, failed } = await syncGameWeekScores(gameWeekId, { userId });
  revalidateGameWeek(gameWeekId);
  if (succeeded > 0) return { ok: true, message: "Score synced from FPL." };
  return { ok: false, message: failed[0]?.error ?? "Nothing was synced." };
}

export async function submitManualScoreAction(
  gameWeekId: string,
  userId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const admin = await requireAdmin();
  const parsed = submitManualScoreSchema.safeParse({
    gameWeekId,
    userId,
    points: formData.get("points"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await submitManualScore(parsed.data, { userId: admin.id });
  revalidateGameWeek(gameWeekId);
}

export async function markPrizePaymentPaidAction(
  gameWeekId: string,
  prizePaymentId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const admin = await requireAdmin();
  // referenceNumber/notes were dropped from the form — a screenshot is enough.
  // They stay optional in the schema, so we simply don't pass them (an absent
  // form field is null, which would fail the string validation).
  const parsed = markPrizePaymentPaidSchema.safeParse({
    prizePaymentId,
    method: formData.get("method"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const proof = formData.get("proof");

  try {
    await markPrizePaymentPaid(
      {
        prizePaymentId: parsed.data.prizePaymentId,
        method: parsed.data.method,
        referenceNumber: parsed.data.referenceNumber,
        notes: parsed.data.notes,
        proof: proof instanceof File && proof.size > 0 ? proof : undefined,
      },
      { userId: admin.id },
    );
  } catch (error) {
    return error instanceof Error ? error.message : "Could not mark this prize as paid";
  }
  revalidateGameWeek(gameWeekId);
}
