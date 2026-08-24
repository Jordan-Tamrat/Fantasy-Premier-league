import { z } from "zod";

export const submitPaymentSchema = z.object({
  gameWeekId: z.string().min(1),
  method: z.enum(["TELEBIRR", "CBE"]),
});
export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;

export const rejectPaymentSchema = z.object({
  paymentId: z.string().min(1),
  reason: z.string().trim().min(1).max(500),
});
export type RejectPaymentInput = z.infer<typeof rejectPaymentSchema>;
