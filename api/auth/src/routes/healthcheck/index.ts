import { createHealthCheckRoute } from "@incmix-api/utils"
import { envVars } from "@/env-vars"
import type { HonoApp } from "@/types"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  // Pass all environment variables to check
  envVars: {
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    EMAIL_API_URL: envVars.EMAIL_API_URL,
    FRONTEND_URL: envVars.FRONTEND_URL,
    GOOGLE_CLIENT_ID: envVars.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: envVars.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URL: envVars.GOOGLE_REDIRECT_URL,
    INTL_API_URL: envVars.INTL_API_URL,
    USERS_API_URL: envVars.USERS_API_URL,
    DATABASE_URL: envVars.DATABASE_URL,
  },

  // Add service-specific checks
  checks: [
    {
      name: "Database",
      check: async (c) => {
        try {
          // Simple query to check database connectivity
          await c.get("db").selectFrom("users").selectAll().limit(1).execute()
          return true
        } catch (_error) {
          return false
        }
      },
    },
  ],
})

export default healthcheckRoutes
