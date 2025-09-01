import type { OpenAPIHono } from "@hono/zod-openapi"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import emailRoutes from "./email"
import healthcheckRoutes from "./healthcheck"
// import webhookRoutes from "./webhook"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}`, emailRoutes)
  // app.route(`${BASE_PATH}/webhooks`, webhookRoutes)
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
}
