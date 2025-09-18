import { createAPIService } from "@incmix-api/utils/fastify-bootstrap"

import { setupMiddleware } from "@/middleware"
import { setupRoutes } from "@/routes"
import { Services } from "./env-vars"

const service = await createAPIService({
  name: Services.auth,
  setupMiddleware,
  setupRoutes,
})

const { app, startServer } = service

startServer()

export default app
