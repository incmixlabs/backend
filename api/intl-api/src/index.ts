import { createAPIService } from "@incmix-api/utils/fastify-bootstrap"
import { Services } from "@/env-vars"
import { setupMiddleware } from "@/middleware"
import { setupRoutes } from "@/routes"
import "./types"

const service = createAPIService({
  name: Services.intl,
  setupMiddleware,
  setupRoutes,
})

const { app, startServer } = service

startServer()

export default app
