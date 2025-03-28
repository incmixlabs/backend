import { z } from "@hono/zod-openapi"

export const HealthCheckSchema = z
  .object({
    status: z.string().openapi({ example: "UP" }),
    reason: z.string().optional().openapi({ example: "Bucket Missing" }),
  })
  .openapi("Healthcheck")
