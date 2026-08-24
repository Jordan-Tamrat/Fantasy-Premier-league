"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { markAllRead } from "@/services/notificationService";

export async function markAllReadAction() {
  const user = await requireUser();
  await markAllRead(user.id);
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
