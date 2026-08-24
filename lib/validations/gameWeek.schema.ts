import { z } from "zod";

export const createGameWeekSchema = z.object({
  fplEventId: z.coerce.number().int().positive(),
  entryFee: z.coerce.number().nonnegative(),
  minParticipants: z.coerce.number().int().positive(),
  paymentDeadlineOffsetHours: z.coerce.number().nonnegative(),
  announcement: z.string().trim().max(2000).optional(),
});
export type CreateGameWeekInput = z.infer<typeof createGameWeekSchema>;

export const updateGameWeekSchema = z.object({
  gameWeekId: z.string().min(1),
  entryFee: z.coerce.number().nonnegative().optional(),
  minParticipants: z.coerce.number().int().positive().optional(),
  paymentDeadlineOffsetHours: z.coerce.number().nonnegative().optional(),
  announcement: z.string().trim().max(2000).optional(),
});
export type UpdateGameWeekInput = z.infer<typeof updateGameWeekSchema>;
