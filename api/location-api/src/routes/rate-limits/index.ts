import type { FastifyInstance, FastifyPlugin } from "fastify"
import fp from "fastify-plugin"

const rateLimitRoutes: FastifyPlugin = (fastify: FastifyInstance) => {
  // Get limits
  fastify.get("/", (_request, reply) => {
    return reply.code(501).send({ message: "Get limits - Not implemented yet" })
  })
}

export default fp(rateLimitRoutes)
