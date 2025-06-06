import { envVars } from "@/env-vars"
import { healthCheck } from "@/routes/health-check/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
const healthcheckRoutes = new OpenAPIHono<HonoApp>()

healthcheckRoutes.openapi(healthCheck, async (c) => {
  try {
    await c.get("db").selectFrom("userProfiles").selectAll().execute()
    const { AUTH_API_URL, COOKIE_NAME, DOMAIN, INTL_API_URL, FILES_API_URL } =
      envVars
    let status = "UP"
    const missing: string[] = []
    if (!AUTH_API_URL) {
      status = "DOWN"
      missing.push("AUTH_API_URL")
    }

    if (!COOKIE_NAME) {
      status = "DOWN"
      missing.push("COOKIE_NAME")
    }
    if (!DOMAIN) {
      status = "DOWN"
      missing.push("DOMAIN")
    }
    if (!INTL_API_URL) {
      status = "DOWN"
      missing.push("INTL_API_URL")
    }
    if (!FILES_API_URL) {
      status = "DOWN"
      missing.push("FILES_API_URL")
    }

    return c.json(
      {
        status,
        reason:
          missing.length > 0
            ? `Env variables missing: [${missing.join(", ")}]`
            : undefined,
      },
      200
    )
  } catch (error) {
    let reason = "Database error"
    if (error instanceof Error) reason = error.message
    return c.json(
      {
        status: "DOWN",
        reason,
      },
      200
    )
  }
})

export default healthcheckRoutes
