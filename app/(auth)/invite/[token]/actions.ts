"use server";

import { AuthError } from "next-auth";
import { acceptInviteSchema } from "@/lib/validations/invite.schema";
import { acceptInvite } from "@/services/inviteService";
import { signIn } from "@/lib/auth";

export async function acceptInviteAction(_prevState: string | undefined, formData: FormData) {
  const parsed = acceptInviteSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Invalid input";
  }

  let email: string;
  try {
    const user = await acceptInvite(parsed.data.token, parsed.data.name, parsed.data.password);
    email = user.email;
  } catch (error) {
    return error instanceof Error ? error.message : "Could not accept this invite";
  }

  try {
    await signIn("credentials", { email, password: parsed.data.password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Account created — please sign in.";
    }
    throw error;
  }
}
