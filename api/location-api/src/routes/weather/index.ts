import type { FastifyInstance, FastifyPlugin } from "fastify"
import fp from "fastify-plugin"

const weatherRoutes: FastifyPlugin = (fastify: FastifyInstance) => {
  // Get weather forecast
  fastify.get("/", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Get weather forecast - Not implemented yet" })
  })
}

export default fp(weatherRoutes)
