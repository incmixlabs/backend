import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"
import { healthCheck } from "./openapi"

const healthcheckRoutes = new OpenAPIHono<HonoApp>()

healthcheckRoutes.openapi(healthCheck, async (c) => {
  try {
    const { error } = await c.env.DB.prepare("select * from tasks").run()
    if (error) throw error

    const { AUTH_URL, COOKIE_NAME, DOMAIN, INTL_URL } = c.env
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
