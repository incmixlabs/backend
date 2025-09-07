import type { FastifyInstance } from "fastify"

export default function healthcheckRoutes(app: FastifyInstance) {
  app.get("/", (_request, reply) => {
    return reply.status(200).send({
      status: "ok",
      service: "auth-api",
      timestamp: new Date().toISOString(),
    })
  })
}
