import { createHealthCheckRoute } from "@incmix-api/utils"
import { envVars } from "@/env-vars"
import type { HonoApp } from "@/types"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  envVars: {
    AUTH_API_URL: envVars.AUTH_API_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    DATABASE_URL: envVars.DATABASE_URL,
  },

  checks: [
    {
      name: "Database",
      check: async (c) => {
        try {
          await c.get("db").selectFrom("locales").selectAll().execute()
          return true
        } catch (_error) {
          return false
        }
      },
    },
  ],
})

export default healthcheckRoutes
