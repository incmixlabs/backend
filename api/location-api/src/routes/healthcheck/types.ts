import { z } from "zod"

export const HealthCheckSchema = z.object({
  status: z.string(),
  reason: z.string().optional(),
})
