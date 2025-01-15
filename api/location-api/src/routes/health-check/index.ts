import { healthCheck } from "@/routes/health-check/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"

const healthcheckRoutes = new OpenAPIHono<HonoApp>()

healthcheckRoutes.openapi(healthCheck, (c) => {
  try {
    const {
      DOMAIN,
      INTL_URL,
      LOCATION_API_KEY,
      LOCATION_URL,
      WEATHER_API_KEY,
      WEATHER_URL,
    } = c.env

    let status = "UP"
    const missing: string[] = []

    if (!DOMAIN) {
      status = "DOWN"
      missing.push("DOMAIN")
    }

    if (!LOCATION_API_KEY) {
      status = "DOWN"
      missing.push("LOCATION_API_KEY")
    }
    if (!LOCATION_URL) {
      status = "DOWN"
      missing.push("LOCATION_URL")
    }
    if (!WEATHER_API_KEY) {
      status = "DOWN"
      missing.push("WEATHER_API_KEY")
    }
    if (!WEATHER_URL) {
      status = "DOWN"
      missing.push("WEATHER_URL")
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
