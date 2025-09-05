import type { AjvOpenApiHono } from "@incmix-api/utils/openapi/ajv-openapi"
import { BASE_PATH } from "@/lib/constants"
import filesRoutes from "@/routes/files"
import healthcheckRoutes from "@/routes/healthcheck"
import type { HonoApp } from "@/types"

export const routes = (app: AjvOpenApiHono<HonoApp>) => {
  app.route(BASE_PATH, filesRoutes)
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
}
