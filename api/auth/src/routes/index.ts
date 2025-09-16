import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"
import { setupAuthRoutes } from "@/routes/auth"
import { setupEmailVerificationRoutes } from "@/routes/email-verification"
import { setupHealthcheckRoutes } from "@/routes/healthcheck"
import { setupOAuthRoutes } from "@/routes/oauth"
import { setupResetPasswordRoutes } from "@/routes/reset-password"
import { setupUsersRoutes } from "./users"

export const setupRoutes = async (app: FastifyInstance) => {
  // Get NODE_ENV from the app context bindings if available, otherwise from envVars
  const nodeEnv = (app as any).bindings?.NODE_ENV || envVars.NODE_ENV

  // Add a direct test route to verify routing works at all
  if (nodeEnv === "test") {
    app.get("/api/auth/test-direct", (_request, _reply) => {
      return { message: "Direct route works!" }
    })
  }
  // Register all routes with the base path prefix
  await app.register(
    async (fastify) => {
      // Add a simple test route to verify routing works
      if (nodeEnv === "test") {
        fastify.get("/test", (_request, _reply) => {
          return { message: "Test route works!" }
        })
      }

      await setupAuthRoutes(fastify)
      await setupHealthcheckRoutes(fastify)
      await setupResetPasswordRoutes(fastify)
      await setupEmailVerificationRoutes(fastify)
      await fastify.register(setupOAuthRoutes, { prefix: "/oauth" })
      await setupUsersRoutes(fastify)
    },
    { prefix: "/api/auth" }
  )
}
