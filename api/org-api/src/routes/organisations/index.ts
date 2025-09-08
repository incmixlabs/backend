import type { FastifyInstance, FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"

const orgRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get organisation by handle
  fastify.get("/:handle", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Get organisation by handle - Not implemented yet" })
  })

  // Get organisation by ID
  fastify.get("/id/:id", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Get organisation by ID - Not implemented yet" })
  })

  // Get user organisations
  fastify.get("/", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Get user organisations - Not implemented yet" })
  })

  // Validate handle
  fastify.post("/validate-handle", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Validate handle - Not implemented yet" })
  })

  // Create organisation
  fastify.post("/", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Create organisation - Not implemented yet" })
  })

  // Add member
  fastify.post("/:handle/members", (_request, reply) => {
    return reply.code(501).send({ message: "Add member - Not implemented yet" })
  })

  // Update organisation
  fastify.put("/:handle", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Update organisation - Not implemented yet" })
  })

  // Delete organisation
  fastify.delete("/:handle", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Delete organisation - Not implemented yet" })
  })

  // Remove members
  fastify.delete("/:handle/members", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Remove members - Not implemented yet" })
  })

  // Get organization members
  fastify.get("/:handle/members", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Get organization members - Not implemented yet" })
  })

  // Get organization permissions
  fastify.get("/:handle/permissions", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Get organization permissions - Not implemented yet" })
  })
}

export default fp(orgRoutes, { name: "org-routes" })
