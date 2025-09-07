import type { FastifyInstance, FastifyPlugin } from "fastify"

const genaiRoutes: FastifyPlugin = (fastify: FastifyInstance) => {
  fastify.post("/project-hierarchy", (request, reply) => {
    const user = (request as any).user
    if (!user) {
      return reply.code(401).send({ error: "Unauthorized" })
    }

    // Set content-type for SSE
    reply.type("text/event-stream")
    reply.header("Cache-Control", "no-cache")
    reply.header("Connection", "keep-alive")

    // Mock SSE response for testing
    const mockResponse = `data: {"type":"project","name":"Test Project"}\n\ndata: {"type":"epic","name":"Epic 1"}\n\ndata: [DONE]\n\n`

    return reply.send(mockResponse)
  })

  fastify.post("/generate", (_request, reply) => {
    return reply.code(501).send({ message: "Not implemented yet" })
  })
}

export default genaiRoutes
