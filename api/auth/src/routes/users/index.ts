import type { FastifyInstance, FastifyPluginCallback } from "fastify"

const usersRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _options,
  done
) => {
  // User onboarding
  fastify.post("/onboarding", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // Get all users (admin)
  fastify.get("/", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // Update user profile
  fastify.put("/", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // Add profile picture
  fastify.post("/profile-picture", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // Delete profile picture
  fastify.delete("/profile-picture", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // Get profile picture
  fastify.get("/profile-picture", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // Set user verified status (admin)
  fastify.put("/verified", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // Set user enabled status (admin)
  fastify.put("/enabled", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // Set user password (admin)
  fastify.put("/password", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })
  done()
}

export default usersRoutes
