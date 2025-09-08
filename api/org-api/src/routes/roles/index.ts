import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
} from "fastify"

const rolesRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) => {
  fastify.post("/", async (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Add new role - Not implemented yet" })
  })

  // Update role
  fastify.put("/:id", async (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Update role - Not implemented yet" })
  })

  // Delete role
  fastify.delete("/:id", async (_request, reply) => {
    return reply
      .code(501)
      .send({ message: "Delete role - Not implemented yet" })
  })
}

export default rolesRoutes
