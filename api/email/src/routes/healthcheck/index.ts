import { envVars } from "@/env-vars"
import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  envVars: {
    DATABASE_URL: envVars.DATABASE_URL,
    INTL_API_URL: envVars.INTL_API_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    RESEND_API_KEY: envVars.RESEND_API_KEY,
  },

  checks: [
    {
      name: "Database",
      check: async (c) => {
        try {
          await c.get("db").selectFrom("emailQueue").selectAll().execute()
          return true
        } catch (_error) {
          return false
        }
      },
    },
  ],
})

export default healthcheckRoutes
