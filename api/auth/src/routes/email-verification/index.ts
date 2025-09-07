import type { FastifyInstance, FastifyPluginCallback } from "fastify"

const emailVerificationRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _options,
  done
) => {
  // Send verification email
  fastify.post("/send", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // Verify email with code
  fastify.post("/verify", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })
  done()
}

export default emailVerificationRoutes
