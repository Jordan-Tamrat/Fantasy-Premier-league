"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { announcementSchema } from "@/lib/validations/phase2.schema";
import { createAnnouncement, deleteAnnouncement } from "@/services/announcementService";

export async function createAnnouncementAction(_prevState: string | undefined, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = announcementSchema.safeParse({ title: formData.get("title"), body: formData.get("body") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  try {
    await createAnnouncement(parsed.data, { userId: admin.id });
  } catch (error) {
    return error instanceof Error ? error.message : "Could not post announcement";
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
  revalidatePath("/chat");
}

export async function deleteAnnouncementAction(announcementId: string) {
  const admin = await requireAdmin();
  await deleteAnnouncement(announcementId, { userId: admin.id });
  revalidatePath("/admin/announcements");
  revalidatePath("/announcements");
}
