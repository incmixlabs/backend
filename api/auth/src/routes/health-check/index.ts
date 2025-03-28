import { envVars } from "@/env-vars"
import { db } from "@/lib/db"
import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  // Pass all environment variables to check
  envVars: {
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    EMAIL_URL: envVars.EMAIL_URL,
    FRONTEND_URL: envVars.FRONTEND_URL,
    GOOGLE_CLIENT_ID: envVars.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: envVars.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URL: envVars.GOOGLE_REDIRECT_URL,
    INTL_URL: envVars.INTL_URL,
    USERS_API_URL: envVars.USERS_API_URL,
  },

  // Add service-specific checks
  checks: [
    {
      name: "Database",
      check: async () => {
        try {
          // Simple query to check database connectivity
          await db.selectFrom("users").selectAll().limit(1).execute()
          return true
        } catch (_error) {
          return false
        }
      },
    },
  ],

  // Set OpenAPI tags
  tags: ["Health Check"],

  // No authentication required for health check
  requireAuth: false,
})

export default healthcheckRoutes
