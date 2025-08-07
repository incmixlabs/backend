import { envVars } from "@/env-vars"

import type { HonoApp } from "@/types"
import { createHealthCheckRoute } from "@incmix-api/utils"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
  envVars: {
    AUTH_API_URL: envVars.AUTH_API_URL,
    COOKIE_NAME: envVars.COOKIE_NAME,
    DOMAIN: envVars.DOMAIN,
    INTL_API_URL: envVars.INTL_API_URL,
  },

  checks: [
    {
      name: "Database",
      check: async (c) => {
        try {
          const roles = await c
            .get("db")
            .selectFrom("roles")
            .selectAll()
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
