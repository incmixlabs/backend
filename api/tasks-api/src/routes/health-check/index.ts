import { envVars } from "@/env-vars"
import { db } from "@/lib/db"
import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  // Pass all environment variables to check
  envVars: {
    AUTH_URL: envVars.AUTH_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    INTL_URL: envVars.INTL_URL,
  },

  // Add service-specific checks
  checks: [
    {
      name: "Database",
      check: async () => {
        try {
          // Simple query to check database connectivity
          await db.selectFrom("tasks").selectAll().limit(1).execute()
          return true
        } catch (_error) {
          return false
        }
      },
    },
  ],

  // Set OpenAPI tags
  tags: ["Healthcheck"],

  // Require authentication (optional, this particular service uses it)
  requireAuth: true,
})

export default healthcheckRoutes
