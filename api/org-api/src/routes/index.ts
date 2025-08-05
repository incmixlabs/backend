import { BASE_PATH } from "@/lib/constants"
import orgRoutes from "@/routes/organisations"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import healthcheckRoutes from "./health-check"
import permissionRoutes from "./permissions"
import rolesRoutes from "./roles"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}/roles`, rolesRoutes)
  app.route(`${BASE_PATH}/permissions`, permissionRoutes)
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(BASE_PATH, orgRoutes)
}
