import type { FastifyInstance, FastifyPluginAsync } from "fastify"

const permissionRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  // Get roles permissions
  fastify.get("/roles", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Get roles permissions - Not implemented yet" })
  })

  // Update permissions
  fastify.patch("/:orgId/permissions", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Update permissions - Not implemented yet" })
  })

  // Add new role
  fastify.post("/roles", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Add new role - Not implemented yet" })
  })

  // Update role
  fastify.put("/roles/:id", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Update role - Not implemented yet" })
  })

  // Delete role
  fastify.delete("/roles/:id", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Delete role - Not implemented yet" })
  })

  // Update member role
  fastify.patch("/:handle/members/role", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Update member role - Not implemented yet" })
  })
}

export default permissionRoutes
