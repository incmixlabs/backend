import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"
import { setupHealthcheckRoutes } from "@/routes/health-check"
import { setupOrgRoutes } from "./orgs"
import { setupPermissionRoutes } from "./permissions"

export const setupRoutes = async (app: FastifyInstance) => {
  // Add a direct test route to verify routing works at all
  if (envVars.NODE_ENV === "test") {
    app.get("/api/orgs/test-direct", async (_request, _reply) => {
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
      await setupPermissionRoutes(fastify)
      await setupOrgRoutes(fastify)
    },
    { prefix: "/api/orgs" }
  )
}
