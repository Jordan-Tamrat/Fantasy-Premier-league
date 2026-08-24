import { z } from "zod";

export const createInviteSchema = z.object({
  email: z.email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});
export type CreateInviteInput = z.infer<typeof createInviteSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(100),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
