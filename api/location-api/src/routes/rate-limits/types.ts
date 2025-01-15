import { z } from "@hono/zod-openapi"

export const RateLimitSchema = z
  .object({
    time: z
      .number()
      .int()
      .openapi({ example: 60, description: "Time in seconds" }),
    limit: z
      .number()
      .int()
      .openapi({ example: 10, description: "No of requests" }),
  })
  .openapi("RateLimits")
