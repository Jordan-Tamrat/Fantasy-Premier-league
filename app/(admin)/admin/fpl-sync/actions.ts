"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { syncGameWeekScores } from "@/services/fplSyncService";

export async function syncNowAction(gameWeekId: string, _prevState: string | undefined) {
  await requireAdmin();
  const result = await syncGameWeekScores(gameWeekId);
  revalidatePath("/admin/fpl-sync");
  revalidatePath(`/admin/gameweeks/${gameWeekId}`);
  return `Synced ${result.succeeded} participant(s)${result.failed.length ? `, ${result.failed.length} failed` : ""}.`;
}
