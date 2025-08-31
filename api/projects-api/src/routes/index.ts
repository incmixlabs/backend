import { BASE_PATH } from "@/lib/constants"
import healthcheckRoutes from "@/routes/healthcheck"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import projectRoutes from "./projects"
import tasksRoutes from "./tasks"
export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(BASE_PATH, projectRoutes)
  // Tasks routes are mounted but NOT included in main OpenAPI spec
  // They have their own dedicated OpenAPI documentation at /api/projects/tasks/reference
}
