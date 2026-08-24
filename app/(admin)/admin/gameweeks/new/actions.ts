"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createGameWeekSchema } from "@/lib/validations/gameWeek.schema";
import { createGameWeek } from "@/services/gameWeekLifecycle";

export async function createGameWeekAction(_prevState: string | undefined, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = createGameWeekSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  let gameWeekId: string;
  try {
    const gameWeek = await createGameWeek(parsed.data, { userId: admin.id });
    gameWeekId = gameWeek.id;
  } catch (error) {
    return error instanceof Error ? error.message : "Could not create Game Week";
  }

  redirect(`/admin/gameweeks/${gameWeekId}`);
}
