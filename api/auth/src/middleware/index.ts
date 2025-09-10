import type { FastifyInstance } from "fastify"

export const setupMiddleware = async (app: FastifyInstance) => {
  // Basic request logging
  app.addHook("onRequest", async (request, _reply) => {
    console.log(`${request.method} ${request.url}`)
  })

  // Add request ID for tracing
  app.addHook("onRequest", async (_request, reply) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    reply.header("x-request-id", requestId)
  })
}
