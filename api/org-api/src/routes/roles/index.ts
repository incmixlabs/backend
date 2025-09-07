import type { FastifyInstance, FastifyPlugin } from "fastify"
import fp from "fastify-plugin"

const rolesRoutes: FastifyPlugin = (fastify: FastifyInstance) => {
  // Add new role
  fastify.post("/", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Add new role - Not implemented yet" })
  })

  // Update role
  fastify.put("/:id", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Update role - Not implemented yet" })
  })

  // Delete role
  fastify.delete("/:id", (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Delete role - Not implemented yet" })
  })
}

export default fp(rolesRoutes)
