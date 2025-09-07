import { HealthCheckSchema } from "@/routes/healthcheck/types"

export const healthCheckSchema = {
  response: {
    200: HealthCheckSchema,
  },
}
