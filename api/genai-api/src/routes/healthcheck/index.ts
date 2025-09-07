import { createHealthCheckRoute } from "@incmix-api/utils"
import { envVars } from "@/env-vars"
import { BASE_PATH } from "@/lib/constants"

const healthcheckRoutes = createHealthCheckRoute({
  // Pass all environment variables to check
  envVars: {
    AUTH_API_URL: envVars.AUTH_API_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    INTL_API_URL: envVars.INTL_API_URL,
    DATABASE_URL: envVars.DATABASE_URL,
  },

  basePath: BASE_PATH,

  // Add service-specific checks
  checks: [
    {
      name: "Database",
      check: async (request) => {
        try {
          // Get database from request context
          const db = (request as any).db
          if (!db) return false

          // Simple query to check database connectivity
          await db.selectFrom("storyTemplates").selectAll().limit(1).execute()
          return true
        } catch (_error) {
          return false
        }
      },
    },
  ],
})

export default healthcheckRoutes
