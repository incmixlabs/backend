import type { FastifyInstance, FastifyPlugin } from "fastify"
import fp from "fastify-plugin"

const tasksRoutes: FastifyPlugin = (fastify: FastifyInstance) => {
  fastify.post("/pull", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  fastify.post("/push", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })
}

export default fp(tasksRoutes)
