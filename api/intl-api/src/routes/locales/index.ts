import type { FastifyInstance, FastifyPlugin } from "fastify"

const localesRoutes: FastifyPlugin = (fastify: FastifyInstance) => {
  // GET / - Get all locales
  fastify.get("/", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // POST / - Add locale
  fastify.post("/", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // GET /default - Get default locale
  fastify.get("/default", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // GET /:code - Get specific locale
  fastify.get("/:code", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // PUT /:code - Update locale
  fastify.put("/:code", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })

  // DELETE /:code - Delete locale
  fastify.delete("/:code", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })
}

export default localesRoutes
