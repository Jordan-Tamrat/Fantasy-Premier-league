"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { disputeSchema } from "@/lib/validations/phase2.schema";
import { createDispute } from "@/services/disputeService";

export async function createDisputeAction(_prevState: string | undefined, formData: FormData) {
  const user = await requireUser();
  const parsed = disputeSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  try {
    await createDispute(parsed.data, { userId: user.id });
  } catch (error) {
    return error instanceof Error ? error.message : "Could not raise this dispute";
  }

  revalidatePath("/disputes");
}
