import { createHealthCheckRoute } from "@incmix-api/utils"
import { envVars } from "@/env-vars"
import type { HonoApp } from "@/types"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  envVars: {
    DOMAIN: envVars.DOMAIN,
    INTL_API_URL: envVars.INTL_API_URL,
    LOCATION_API_KEY: envVars.LOCATION_API_KEY,
    LOCATION_URL: envVars.LOCATION_URL,
    WEATHER_API_KEY: envVars.WEATHER_API_KEY,
    WEATHER_URL: envVars.WEATHER_URL,
  },

  checks: [
    {
      name: "Redis",
      check: async (c) => {
        try {
          const result = await c.get("redis").ping()
          return result === "PONG"
        } catch (_error) {
          return false
        }
      },
    },
  ],
})

export default healthcheckRoutes
