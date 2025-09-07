import type { FastifyInstance, FastifyPlugin } from "fastify"

const messagesRoutes: FastifyPlugin = (fastify: FastifyInstance) => {
  // GET / - Get all messages (with pagination and filtering)
  fastify.get("/", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // POST / - Add message
  fastify.post("/", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // PUT / - Update message
  fastify.put("/", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // DELETE / - Delete messages
  fastify.delete("/", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // GET /default - Get default messages
  fastify.get("/default", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // GET /namespaces/:locale/:namespace - Get messages by namespace
  fastify.get("/namespaces/:locale/:namespace", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // GET /:locale - Get all messages by locale
  fastify.get("/:locale", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // GET /:locale/:key - Get specific message
  fastify.get("/:locale/:key", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })
}

export default messagesRoutes
