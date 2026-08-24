import { z } from "zod";

export const linkFplAccountSchema = z.object({
  fplEntryId: z.coerce.number().int().positive(),
});
export type LinkFplAccountInput = z.infer<typeof linkFplAccountSchema>;
