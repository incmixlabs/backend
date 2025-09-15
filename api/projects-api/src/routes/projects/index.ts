import type { FastifyInstance } from "fastify"

export const setupProjectRoutes = async (app: FastifyInstance) => {
  // TODO: Implement project routes
  app.get("/", async (_request, reply) => {
    return reply.code(501).send({ error: "Project routes not implemented yet" })
  })
}
