import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import healthcheckRoutes from "@/routes/healthcheck"
import projectRoutes from "./projects"
import tasksRoutes from "./tasks"

export const routes = async (app: FastifyInstance) => {
  await app.register(healthcheckRoutes, { prefix: `${BASE_PATH}/healthcheck` })
  await app.register(tasksRoutes, { prefix: `${BASE_PATH}/tasks` })
  await app.register(projectRoutes, { prefix: BASE_PATH })
}
