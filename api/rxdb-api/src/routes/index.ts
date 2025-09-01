import { BASE_PATH } from "@/lib/constants"
import healthcheckRoutes from "@/routes/healthcheck"
import labelsRoutes from "@/routes/labels"
import projectsRoutes from "@/routes/projects"
import tasksRoutes from "@/routes/tasks"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"

export const routes = (app: OpenAPIHono<HonoApp>) => {
  app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
  app.route(`${BASE_PATH}/labels`, labelsRoutes)
  app.route(`${BASE_PATH}/projects`, projectsRoutes)
  app.route(`${BASE_PATH}/tasks`, tasksRoutes)
}
