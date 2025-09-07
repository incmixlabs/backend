import type { FastifyInstance, FastifyPlugin } from "fastify"
import fp from "fastify-plugin"

const commentsRoutes: FastifyPlugin = (fastify: FastifyInstance) => {
  fastify.get("/projects/:projectId", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  fastify.post("/projects/:projectId", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  fastify.get("/tasks/:taskId", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  fastify.post("/tasks/:taskId", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  fastify.put("/:commentId", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  fastify.delete("/:commentId", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })
}

export default fp(commentsRoutes)
