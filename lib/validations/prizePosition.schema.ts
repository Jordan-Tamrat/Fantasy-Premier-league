import { z } from "zod";

export const setPrizePositionsSchema = z.object({
  gameWeekId: z.string().min(1),
  positions: z
    .array(
      z.object({
        position: z.coerce.number().int().positive(),
        amount: z.coerce.number().nonnegative(),
      }),
    )
    .min(1),
});
export type SetPrizePositionsInput = z.infer<typeof setPrizePositionsSchema>;
