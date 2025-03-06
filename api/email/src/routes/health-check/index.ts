import { envVars } from "@/env-vars"
import { db } from "@/lib/db"
import { healthCheck } from "@/routes/health-check/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"

const healthcheckRoutes = new OpenAPIHono<HonoApp>()

healthcheckRoutes.openapi(healthCheck, async (c) => {
  try {
    await db.selectFrom("emailQueue").selectAll().execute()

    const { SENDGRID_API_KEY, SENDGRID_WEBHOOK_KEY } = envVars

    let status = "UP"
    const missing: string[] = []

    if (!SENDGRID_API_KEY) {
      status = "DOWN"
      missing.push("SENDGRID_API_KEY")
    }

    if (!SENDGRID_WEBHOOK_KEY) {
      status = "DOWN"
      missing.push("SENDGRID_WEBHOOK_KEY")
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
