"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { resetPasswordWithToken } from "@/services/passwordResetService";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function resetWithTokenAction(_prevState: string | undefined, formData: FormData) {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";

  try {
    await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  } catch (error) {
    return error instanceof Error ? error.message : "Could not reset your password";
  }

  redirect("/login?reset=1");
}
