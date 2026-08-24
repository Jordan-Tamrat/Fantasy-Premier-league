"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations/profile.schema";
import { linkFplAccountSchema } from "@/lib/validations/fplAccount.schema";
import { linkFplAccount, unlinkFplAccount } from "@/services/fplSyncService";

export async function updateProfileAction(_prevState: string | undefined, formData: FormData) {
  const user = await requireUser();
  const parsed = updateProfileSchema.safeParse({
    telebirrNumber: formData.get("telebirrNumber"),
    cbeAccountNumber: formData.get("cbeAccountNumber"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telebirrNumber: parsed.data.telebirrNumber || null,
      cbeAccountNumber: parsed.data.cbeAccountNumber || null,
    },
  });

  revalidatePath("/profile");
  return "Saved";
}

export async function linkFplAccountAction(_prevState: string | undefined, formData: FormData) {
  const user = await requireUser();
  const parsed = linkFplAccountSchema.safeParse({ fplEntryId: formData.get("fplEntryId") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid FPL entry ID";

  try {
    await linkFplAccount(user.id, parsed.data.fplEntryId);
  } catch {
    return "Could not find that FPL team. Double check the entry ID.";
  }

  revalidatePath("/profile");
}

export async function unlinkFplAccountAction() {
  const user = await requireUser();
  await unlinkFplAccount(user.id);
  revalidatePath("/profile");
}
