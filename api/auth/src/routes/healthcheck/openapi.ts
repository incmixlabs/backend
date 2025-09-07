import { createRoute } from "@incmix-api/utils/zod-schema"
import { HealthCheckSchema } from "@/routes/healthcheck/types"

export const healthCheck = createRoute({
  path: "/",
  method: "get",
  summary: "Check Service Health",
  tags: ["Health Check"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthCheckSchema,
        },
      },
      description: "Returns Service Status",
    },
  },
})
