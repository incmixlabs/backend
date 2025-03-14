import { BASE_PATH } from "@/lib/constants"
import orgRoutes from "@/routes/organisations"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import healthcheckRoutes from "./health-check"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(BASE_PATH, orgRoutes)
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
}
