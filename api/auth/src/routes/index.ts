import type { FastifyInstance } from "fastify"
import { setupAuthRoutes } from "@/routes/auth"
import { setupEmailVerificationRoutes } from "@/routes/email-verification"
import { setupHealthcheckRoutes } from "@/routes/healthcheck"
import { setupOAuthRoutes } from "@/routes/oauth"
import { setupResetPasswordRoutes } from "@/routes/reset-password"
import { setupUsersRoutes } from "./users"

export const setupRoutes = async (app: FastifyInstance) => {
  // Add a direct test route to verify routing works at all
  app.get("/api/auth/test-direct", async (_request, _reply) => {
    return { message: "Direct route works!" }
  })

  // Register all routes with the base path prefix
  await app.register(
    async (fastify) => {
      // Add a simple test route to verify routing works
      fastify.get("/test", async (_request, _reply) => {
        return { message: "Test route works!" }
      })

      await setupAuthRoutes(fastify)
      await setupHealthcheckRoutes(fastify)
      await setupResetPasswordRoutes(fastify)
      await setupEmailVerificationRoutes(fastify)
      await setupOAuthRoutes(fastify)
      await setupUsersRoutes(fastify)
    },
    { prefix: "/api/auth" }
  )
}
