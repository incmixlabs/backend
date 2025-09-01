import { HealthCheckSchema } from "@/routes/healthcheck/types"
import { createRoute } from "@hono/zod-openapi"

export const healthCheck = createRoute({
  path: "/",
  method: "get",
  security: [{ cookieAuth: [] }],
  summary: "Check Service Health",
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
