import { createService } from "@incmix-api/utils"
import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "./routes"

const service = await createService({
  name: "projects-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: async (app: FastifyInstance) => {
    await middlewares(app)
  },
  setupRoutes: async (app: FastifyInstance) => await routes(app),
})

const { app, startServer } = service

await startServer()

export default app
