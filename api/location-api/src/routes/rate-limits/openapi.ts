import { createRoute } from "@hono/zod-openapi"
import { RateLimitSchema } from "./types"

export const getLimts = createRoute({
  path: "/",
  method: "get",
  summary: "Get Rate Limits",
  description: "Get Rate Limits",
  tags: ["Rate Limit"],
  responses: {
    200: {
      description: "Rate Limit Response",
      content: {
        "application/json": {
          schema: RateLimitSchema,
        },
      },
    },
  },
})
