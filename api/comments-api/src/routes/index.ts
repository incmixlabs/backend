import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"
import { setupHealthcheckRoutes } from "@/routes/healthcheck"
import { setupCommentsRoutes } from "./comments"

export const setupRoutes = async (app: FastifyInstance) => {
  // Add a direct test route to verify routing works at all
  if (envVars.NODE_ENV === "test") {
    app.get("/api/comments/test-direct", (_request, _reply) => {
      return { message: "Direct route works!" }
    })
  }
  // Register all routes with the base path prefix
  await app.register(
    async (fastify) => {
      // Add a simple test route to verify routing works
      if (envVars.NODE_ENV === "test") {
        fastify.get("/test", (_request, _reply) => {
          return { message: "Test route works!" }
        })
      }

      await setupHealthcheckRoutes(fastify)
      await setupCommentsRoutes(fastify)
    },
    { prefix: "/api/comments" }
  )
}
