import { z } from "zod"

export const RateLimitSchema = z.object({
  time: z.number().int(),
  limit: z.number().int(),
})
