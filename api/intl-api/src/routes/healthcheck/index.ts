import { createHealthCheckRoute } from "@incmix-api/utils"
import { envVars } from "@/env-vars"
import { BASE_PATH } from "@/lib/constants"

const healthcheckRoutes = createHealthCheckRoute({
  envVars: {
    AUTH_API_URL: envVars.AUTH_API_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    DATABASE_URL: envVars.DATABASE_URL,
  },

  basePath: BASE_PATH,

  checks: [
    {
      name: "Database",
      check: async (request) => {
        try {
          await request.db?.selectFrom("locales").selectAll().execute()
          return true
        } catch (_error) {
          return false
        }
      },
    },
  ],
})

export default healthcheckRoutes
