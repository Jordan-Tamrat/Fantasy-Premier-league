import { z } from "zod";

export const resetPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  fplEntryId: z.coerce.number().int().positive("Enter your FPL Entry ID"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
