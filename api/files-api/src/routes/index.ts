import type { FastifyInstance } from "fastify"
import { setupFilesRoutes } from "@/routes/files"
import { setupHealthcheckRoutes } from "@/routes/healthcheck"

export const setupRoutes = async (app: FastifyInstance) => {
  // Register all routes with the base path prefix
  await app.register(
    async (fastify) => {
      setupHealthcheckRoutes(fastify)
      setupFilesRoutes(fastify)
    },
    { prefix: "/api/files" }
  )
}
