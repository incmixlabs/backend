import { envVars } from "@/env-vars"
import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"

/**
 * Example implementation of the health check route using the shared utility
 * This is not being used yet - it's just an example of how the new utility could be used
 */
const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  // Pass all environment variables to check
  envVars: {
    AUTH_API_URL: envVars.AUTH_API_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    INTL_API_URL: envVars.INTL_API_URL,
  },

  // Add service-specific checks
  checks: [
    {
      name: "Database",
      check: async (c) => {
        try {
          // Simple query to check database connectivity
          await c.get("db").selectFrom("tasks").selectAll().limit(1).execute()
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
