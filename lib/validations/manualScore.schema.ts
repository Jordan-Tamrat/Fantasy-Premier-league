import { z } from "zod";

export const submitManualScoreSchema = z.object({
  gameWeekId: z.string().min(1),
  userId: z.string().min(1),
  points: z.coerce.number().int(),
  reason: z.string().trim().min(1).max(500),
});
export type SubmitManualScoreInput = z.infer<typeof submitManualScoreSchema>;
