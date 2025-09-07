import type { FastifyInstance, FastifyPlugin } from "fastify"
import fp from "fastify-plugin"

const newsRoutes: FastifyPlugin = (fastify: FastifyInstance) => {
  // Get news topics
  fastify.get("/topics", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Get news topics - Not implemented yet" })
  })

  // Get news by topic
  fastify.get("/", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Get news by topic - Not implemented yet" })
  })
}

export default fp(newsRoutes)
