"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { submitPaymentSchema } from "@/lib/validations/payment.schema";
import { submitPayment } from "@/services/paymentService";

export async function submitPaymentAction(
  gameWeekId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const user = await requireUser();
  const parsed = submitPaymentSchema.safeParse({ gameWeekId, method: formData.get("method") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  const screenshot = formData.get("screenshot");
  if (!(screenshot instanceof File) || screenshot.size === 0) {
    return "Please attach a payment screenshot";
  }

  try {
    await submitPayment({
      gameWeekId: parsed.data.gameWeekId,
      userId: user.id,
      method: parsed.data.method,
      screenshot,
    });
  } catch (error) {
    return error instanceof Error ? error.message : "Failed to submit payment";
  }

  revalidatePath(`/gameweeks/${gameWeekId}`);
}
