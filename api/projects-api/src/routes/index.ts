import type { AjvOpenApiHono } from "@incmix-api/utils/openapi/ajv-openapi"
import { BASE_PATH } from "@/lib/constants"
import healthcheckRoutes from "@/routes/healthcheck"
import type { HonoApp } from "@/types"
import projectRoutes from "./projects"
import tasksRoutes from "./tasks"

export const routes = (app: AjvOpenApiHono<HonoApp>) => {
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(`${BASE_PATH}/tasks`, tasksRoutes)
  app.route(BASE_PATH, projectRoutes)
}
