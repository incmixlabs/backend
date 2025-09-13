import type { FastifyInstance } from "fastify"

export const setupWeatherRoutes = (app: FastifyInstance) => {
  app.get(
    "/weather",
    {
      schema: {
        description: "Get weather forecast",
        tags: ["weather"],
        querystring: {
          type: "object",
          properties: {
            lat: { type: "number" },
            lon: { type: "number" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    (_request, _reply) => {
      // TODO: Implement weather forecast logic
      return { message: "Weather route placeholder - to be implemented" }
    }
  )
}
