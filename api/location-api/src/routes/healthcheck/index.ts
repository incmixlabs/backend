import { createHealthCheckRoute } from "@incmix-api/utils"
import type { FastifyRequest } from "fastify"
import fp from "fastify-plugin"
import { envVars } from "@/env-vars"
import { BASE_PATH } from "@/lib/constants"

const healthcheckRoutes = createHealthCheckRoute({
  envVars: {
    DOMAIN: envVars.DOMAIN,
    INTL_API_URL: envVars.INTL_API_URL,
    LOCATION_API_KEY: envVars.LOCATION_API_KEY,
    LOCATION_URL: envVars.LOCATION_URL,
    WEATHER_API_KEY: envVars.WEATHER_API_KEY,
    WEATHER_URL: envVars.WEATHER_URL,
  },

  basePath: BASE_PATH,

  checks: [
    {
      name: "Redis",
      check: async (request: FastifyRequest) => {
        try {
          // Access redis from the app context - this will need to be updated based on how redis is made available in fastify
          const redis = (request.server as any).redis
          if (!redis) return false
          const result = await redis.ping()
          return result === "PONG"
        } catch (_error) {
          return false
        }
      },
    },
  ],
})

export default fp(healthcheckRoutes)
