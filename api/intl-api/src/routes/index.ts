import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"
import { setupHealthcheckRoutes } from "@/routes/healthcheck"
import { setupLocaleRoutes } from "./locales"
import { setupMessageRoutes } from "./messages"

export const setupRoutes = async (app: FastifyInstance) => {
  // Add a direct test route to verify routing works at all
  if (envVars.NODE_ENV === "test") {
    app.get("/api/intl/test-direct", async (_request, _reply) => {
      return { message: "Direct route works!" }
    })
  }
  // Register all routes with the base path prefix
  await app.register(
    async (fastify) => {
      // Add a simple test route to verify routing works
      if (envVars.NODE_ENV === "test") {
        fastify.get("/test", async (_request, _reply) => {
          return { message: "Test route works!" }
        })
      }

      await setupHealthcheckRoutes(fastify)
      await setupLocaleRoutes(fastify)
      await setupMessageRoutes(fastify)
    },
    { prefix: "/api/intl" }
  )
}
