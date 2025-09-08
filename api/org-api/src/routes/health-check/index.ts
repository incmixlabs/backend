import { createHealthCheckRoute } from "@incmix-api/utils"
import { envVars } from "@/env-vars"
import { BASE_PATH } from "@/lib/constants"

const healthcheckRoutes = createHealthCheckRoute({
  envVars: {
    AUTH_API_URL: envVars.AUTH_API_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    INTL_API_URL: envVars.INTL_API_URL,
  },

  basePath: BASE_PATH,

  checks: [
    {
      name: "Database",
      check: async (request) => {
        try {
          const db = (request as any).db
          if (!db) return false
          const roles = await db
            .selectFrom("roles")
            .select("id")
            .limit(1)
            .execute()
          return roles.length > 0
        } catch (_error) {
          return false
        }
      },
    },
  ],
})

export default healthcheckRoutes
