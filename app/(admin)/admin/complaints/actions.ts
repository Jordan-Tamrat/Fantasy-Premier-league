"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { disputeResponseSchema } from "@/lib/validations/phase2.schema";
import { respondToDispute } from "@/services/disputeService";

export async function respondToDisputeAction(
  disputeId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const admin = await requireAdmin();
  const parsed = disputeResponseSchema.safeParse({
    disputeId,
    status: formData.get("status"),
    adminResponse: formData.get("adminResponse"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  try {
    await respondToDispute(
      parsed.data.disputeId,
      { status: parsed.data.status, adminResponse: parsed.data.adminResponse },
      { userId: admin.id },
    );
  } catch (error) {
    return error instanceof Error ? error.message : "Could not update this complaint";
  }

  revalidatePath("/admin/complaints");
}
