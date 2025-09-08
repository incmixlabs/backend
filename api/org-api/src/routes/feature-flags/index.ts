import type { FastifyInstance, FastifyPluginAsync } from "fastify"

const featureFlagsRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // List feature flags
  fastify.get("/", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "List feature flags - Not implemented yet" })
  })

  // Get feature flag by ID
  fastify.get("/:featureFlagId", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Get feature flag by ID - Not implemented yet" })
  })

  // Create feature flag
  fastify.post("/", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Create feature flag - Not implemented yet" })
  })

  // Update feature flag
  fastify.put("/:featureFlagId", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Update feature flag - Not implemented yet" })
  })

  // Delete feature flag
  fastify.delete("/:featureFlagId", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Delete feature flag - Not implemented yet" })
  })
}

export default featureFlagsRoutes
