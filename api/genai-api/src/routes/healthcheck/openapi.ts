import { createRoute } from "@hono/zod-openapi"
import { HealthCheckSchema } from "@/routes/healthcheck/types"

export const healthCheck = createRoute({
  path: "/",
  method: "get",
  tags: ["Healthcheck"],
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
