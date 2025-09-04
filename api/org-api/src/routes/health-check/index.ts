import { createHealthCheckRoute } from "@incmix-api/utils"
import { envVars } from "@/env-vars"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"

const healthcheckRoutes = createHealthCheckRoute<HonoApp>({
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
