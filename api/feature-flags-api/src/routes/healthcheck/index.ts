import { envVars } from "@/env-vars"

import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  // Pass all environment variables to check
  envVars: {
    AUTH_API_URL: envVars.AUTH_API_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    INTL_API_URL: envVars.INTL_API_URL,
    DATABASE_URL: envVars.DATABASE_URL,
  },

  // Add service-specific checks
  checks: [
    {
      name: "Database",
      check: async (c) => {
        try {
          // Simple query to check database connectivity
          await c
            .get("db")
            .selectFrom("featureFlags")
            .selectAll()
            .limit(1)
            .execute()
          return true
        } catch (_error) {
          return false
        }
      },
    },
  ],
})

export default healthcheckRoutes
