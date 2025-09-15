import type { FastifyInstance } from "fastify"
import { setupHealthcheckRoutes } from "@/routes/healthcheck"
import { setupLabelsRoutes } from "@/routes/labels"
import { setupProjectsRoutes } from "@/routes/projects"
import { setupTasksRoutes } from "@/routes/tasks"

export const setupRoutes = async (app: FastifyInstance) => {
  // Register all routes with the base path prefix
  await app.register(
    async (fastify) => {
      await setupHealthcheckRoutes(fastify)
      await setupLabelsRoutes(fastify)
      await setupProjectsRoutes(fastify)
      await setupTasksRoutes(fastify)
    },
    { prefix: "/api/rxdb" }
  )
}
