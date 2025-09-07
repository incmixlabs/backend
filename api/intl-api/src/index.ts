import { createService } from "@incmix-api/utils"
import type { FastifyInstance } from "fastify"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import { envVars } from "./env-vars"

const service = await createService({
  name: "intl-api",
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
