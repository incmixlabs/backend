import type { FastifyInstance, FastifyPluginCallback } from "fastify"

const oAuthRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _options,
  done
) => {
  // Google OAuth initiation
  fastify.get("/google", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // Google OAuth callback
  fastify.get("/google/callback", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })
  done()
}

export default oAuthRoutes
