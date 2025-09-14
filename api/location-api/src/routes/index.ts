import { setupRedisFastifyPlugin } from "@incmix-api/utils/middleware"
import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"
import { BASE_PATH } from "@/lib/constants"
import { setupHealthcheckRoutes } from "./healthcheck"
import { setupNewsRoutes } from "./news"
import { setupRateLimitRoutes } from "./rate-limits"
import { setupWeatherRoutes } from "./weather"

export const setupRoutes = async (app: FastifyInstance) => {
  // Register Redis plugin from shared utils
  await app.register(setupRedisFastifyPlugin)

  // Add a direct test route to verify routing works at all
  if (envVars.NODE_ENV === "test") {
    app.get("/api/location/test-direct", (_request, _reply) => {
      return { message: "Direct route works!" }
    })
  }
  // Register all routes with the base path prefix
  await app.register(
    (fastify) => {
      // Add a simple test route to verify routing works
      if (envVars.NODE_ENV === "test") {
        fastify.get("/test", (_request, _reply) => {
          return { message: "Test route works!" }
        })
      }

      setupHealthcheckRoutes(fastify)
      setupWeatherRoutes(fastify)
      setupNewsRoutes(fastify)
      setupRateLimitRoutes(fastify)
    },
    { prefix: BASE_PATH }
  )
}
