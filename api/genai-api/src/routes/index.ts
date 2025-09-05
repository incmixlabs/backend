import type { AjvOpenApiHono } from "@incmix-api/utils/openapi/ajv-openapi"
import { BASE_PATH } from "@/lib/constants"
import genaiRoutes from "@/routes/genai"
import healthcheckRoutes from "@/routes/healthcheck"
import type { HonoApp } from "@/types"
import templateRoutes from "./templates"

export const routes = (app: AjvOpenApiHono<HonoApp>) => {
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(`${BASE_PATH}/templates`, templateRoutes)
  app.route(BASE_PATH, genaiRoutes)
}
