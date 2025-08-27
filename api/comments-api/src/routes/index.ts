import type { OpenAPIHono } from "@hono/zod-openapi"
import { BASE_PATH } from "@/lib/constants"
import healthcheckRoutes from "@/routes/healthcheck"
import type { HonoApp } from "@/types"
import commentsRoute from "./comments"
export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(BASE_PATH, commentsRoute)
}
