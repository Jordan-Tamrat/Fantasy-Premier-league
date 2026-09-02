"use server";

import { redirect } from "next/navigation";
import { resetPasswordSchema } from "@/lib/validations/passwordReset.schema";
import { resetPasswordWithFplEntryId } from "@/services/passwordResetService";

export async function resetPasswordAction(_prevState: string | undefined, formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    fplEntryId: formData.get("fplEntryId"),
    password: formData.get("password"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  try {
    await resetPasswordWithFplEntryId(parsed.data.email, parsed.data.fplEntryId, parsed.data.password);
  } catch (error) {
    return error instanceof Error ? error.message : "Could not reset your password";
  }

  redirect("/login?reset=1");
}
