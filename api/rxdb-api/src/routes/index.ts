import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import healthcheckRoutes from "@/routes/healthcheck"
import labelsRoutes from "@/routes/labels"
import projectsRoutes from "@/routes/projects"
import tasksRoutes from "@/routes/tasks"

export const routes = (app: FastifyInstance) => {
  app.register(healthcheckRoutes, { prefix: `${BASE_PATH}/healthcheck` })
  app.register(labelsRoutes, { prefix: `${BASE_PATH}/labels` })
  app.register(projectsRoutes, { prefix: `${BASE_PATH}/projects` })
  app.register(tasksRoutes, { prefix: `${BASE_PATH}/tasks` })
}
