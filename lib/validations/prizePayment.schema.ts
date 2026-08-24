import { z } from "zod";

export const markPrizePaymentPaidSchema = z.object({
  prizePaymentId: z.string().min(1),
  method: z.enum(["TELEBIRR", "CBE"]),
  referenceNumber: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type MarkPrizePaymentPaidInput = z.infer<typeof markPrizePaymentPaidSchema>;
