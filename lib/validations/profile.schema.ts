import { z } from "zod";

export const updateProfileSchema = z.object({
  telebirrNumber: z.string().trim().max(20).optional().or(z.literal("")),
  cbeAccountNumber: z.string().trim().max(30).optional().or(z.literal("")),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
