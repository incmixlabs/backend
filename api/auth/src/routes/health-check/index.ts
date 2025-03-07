import { envVars } from "@/env-vars"
import { healthCheck } from "@/routes/health-check/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"

const healthcheckRoutes = new OpenAPIHono<HonoApp>()

healthcheckRoutes.openapi(healthCheck, (c) => {
  try {
    // const { error } = await c.env.DB.prepare("select * from users").run()
    // if (error) throw error

    const {
      COOKIE_NAME,
      DOMAIN,
      EMAIL_URL,
      FRONTEND_URL,
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URL,
      INTL_URL,
      USERS_API_URL,
    } = envVars
    let status = "UP"
    const missing: string[] = []
    if (!COOKIE_NAME) {
      status = "DOWN"
      missing.push("COOKIE_NAME")
    }

    if (!DOMAIN) {
      status = "DOWN"
      missing.push("DOMAIN")
    }
    if (!EMAIL_URL) {
      status = "DOWN"
      missing.push("EMAIL_URL")
    }
    if (!FRONTEND_URL) {
      status = "DOWN"
      missing.push("FRONTEND_URL")
    }
    if (!GOOGLE_CLIENT_ID) {
      status = "DOWN"
      missing.push("GOOGLE_CLIENT_ID")
    }
    if (!GOOGLE_CLIENT_SECRET) {
      status = "DOWN"
      missing.push("GOOGLE_CLIENT_SECRET")
    }
    if (!GOOGLE_REDIRECT_URL) {
      status = "DOWN"
      missing.push("GOOGLE_REDIRECT_URL")
    }
    if (!INTL_URL) {
      status = "DOWN"
      missing.push("INTL_URL")
    }
    if (!USERS_API_URL) {
      status = "DOWN"
      missing.push("USERS_API_URL")
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
