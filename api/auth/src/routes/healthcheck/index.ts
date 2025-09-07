import type { FastifyInstance, FastifyPluginCallback } from "fastify"

const healthcheckRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _options,
  done
) => {
  fastify.get("/", (_request, reply) => {
    return reply.send({
      status: "ok",
      service: "auth-api",
      timestamp: new Date().toISOString(),
    })
  })
  done()
}

export default healthcheckRoutes
