import type { FastifyInstance } from "fastify"

export const setupRateLimitRoutes = (app: FastifyInstance) => {
  app.get(
    "/rate-limits",
    {
      schema: {
        description: "Get rate limits",
        tags: ["rate-limits"],
        response: {
          200: {
            type: "object",
            properties: {
              time: { type: "number" },
              limit: { type: "number" },
            },
          },
        },
      },
    },
    (_request, _reply) => {
      return {
        time: 100,
        limit: 100,
      }
    }
  )
}
