import type { FastifyInstance } from "fastify"

export const setupNewsRoutes = (app: FastifyInstance) => {
  app.get(
    "/news",
    {
      schema: {
        description: "Get news",
        tags: ["news"],
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
      // TODO: Implement news logic
      return { message: "News route placeholder - to be implemented" }
    }
  )
}
