import { healthCheck } from "@/routes/health-check/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"

const healthcheckRoutes = new OpenAPIHono<HonoApp>()

healthcheckRoutes.openapi(healthCheck, async (c) => {
  try {
    const { results, error } = await c.env.DB.prepare(
      "select * from roles"
    ).all()
    if (error) throw error

    if (!results.length)
      return c.json(
        {
          status: "DOWN",
          reason: "Roles not set in database",
        },

        200
      )

    const { AUTH_URL, COOKIE_NAME, DOMAIN, INTL_URL, USERS_URL } = c.env
    let status = "UP"
    const missing: string[] = []

    if (!AUTH_URL) {
      status = "DOWN"
      missing.push("AUTH_URL")
    }

    if (!COOKIE_NAME) {
      status = "DOWN"
      missing.push("COOKIE_NAME")
    }
    if (!DOMAIN) {
      status = "DOWN"
      missing.push("DOMAIN")
    }
    if (!INTL_URL) {
      status = "DOWN"
      missing.push("INTL_URL")
    }
    if (!USERS_URL) {
      status = "DOWN"
      missing.push("USERS_URL")
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
