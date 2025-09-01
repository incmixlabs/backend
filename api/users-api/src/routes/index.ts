import { BASE_PATH } from "@/lib/constants"
import userRoutes from "@/routes/users"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import healthcheckRoutes from "./health-check"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(BASE_PATH, userRoutes)
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
}
