"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ruleSectionSchema } from "@/lib/validations/phase2.schema";
import { createRuleSection, updateRuleSection, deleteRuleSection } from "@/services/ruleService";

function revalidateRules() {
  revalidatePath("/admin/rules");
  revalidatePath("/rules");
}

export async function createRuleSectionAction(_prevState: string | undefined, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = ruleSectionSchema.safeParse({ title: formData.get("title"), body: formData.get("body") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await createRuleSection(parsed.data, { userId: admin.id });
  revalidateRules();
}

export async function updateRuleSectionAction(
  sectionId: string,
  _prevState: string | undefined,
  formData: FormData,
) {
  const admin = await requireAdmin();
  const parsed = ruleSectionSchema.safeParse({ title: formData.get("title"), body: formData.get("body") });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  await updateRuleSection(sectionId, parsed.data, { userId: admin.id });
  revalidateRules();
  return "Saved";
}

export async function deleteRuleSectionAction(sectionId: string) {
  const admin = await requireAdmin();
  await deleteRuleSection(sectionId, { userId: admin.id });
  revalidateRules();
}
