import { z } from "zod";

export const updateLeagueSettingsSchema = z.object({
  leagueName: z.string().trim().min(1).max(100),
  currency: z.string().trim().min(1).max(10),
  defaultEntryFee: z.coerce.number().nonnegative(),
  defaultPaymentDeadlineOffsetHours: z.coerce.number().nonnegative(),
  defaultMinParticipants: z.coerce.number().int().positive(),
  leagueTelebirrNumber: z.string().trim().max(20).optional().or(z.literal("")),
  leagueCbeAccountNumber: z.string().trim().max(30).optional().or(z.literal("")),
  leagueAccountName: z.string().trim().max(100).optional().or(z.literal("")),
  // Optional: blank clears it, so it's coerced only when actually provided.
  fplLeagueId: z
    .union([z.literal(""), z.coerce.number().int().positive()])
    .optional(),
});
export type UpdateLeagueSettingsInput = z.infer<typeof updateLeagueSettingsSchema>;
