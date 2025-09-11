import { createFastifyService } from "@incmix-api/utils/fastify-bootstrap"
import { envVars } from "@/env-vars"
import { BASE_PATH } from "@/lib/constants"
import { setupMiddleware } from "@/middleware"
import { setupRoutes } from "@/routes"

const service = createFastifyService({
  name: "intl-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware,
  setupRoutes,
  needDb: true,
  needSwagger: true,
  bindings: envVars,
  cors: {
    origin: true,
    credentials: true,
  },
})

const { app, startServer } = service

startServer()

export default app
