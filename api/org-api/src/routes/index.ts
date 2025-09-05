import type { AjvOpenApiHono } from "@incmix-api/utils/openapi/ajv-openapi"
import { BASE_PATH } from "@/lib/constants"
import orgRoutes from "@/routes/organisations"
import type { HonoApp } from "@/types"
import healthcheckRoutes from "./health-check"
import permissionRoutes from "./permissions"

export const routes = (app: AjvOpenApiHono<HonoApp>) => {
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(`${BASE_PATH}/permissions`, permissionRoutes)
  app.route(BASE_PATH, orgRoutes)
}
