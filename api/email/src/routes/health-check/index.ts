import { healthCheck } from "@/routes/health-check/openapi"
import type { HonoApp } from "@/types"
import { OpenAPIHono } from "@hono/zod-openapi"

const healthcheckRoutes = new OpenAPIHono<HonoApp>()

healthcheckRoutes.openapi(healthCheck, async (c) => {
  try {
    const { error } = await c.env.DB.prepare("select * from email_queue").run()
    if (error) throw error

    const { SENDGRID_API_KEY, SENDGRID_WEBHOOK_KEY } = c.env

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
