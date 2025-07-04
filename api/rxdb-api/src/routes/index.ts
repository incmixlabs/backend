import { BASE_PATH } from "@/lib/constants"
import healthcheckRoutes from "@/routes/healthcheck"
import tasksRoutes from "@/routes/tasks"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(BASE_PATH, tasksRoutes)
}
