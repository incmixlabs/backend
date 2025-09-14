import { createAPIService } from "@incmix-api/utils/fastify-bootstrap"
import { Services } from "@/env-vars"
import { setupRoutes } from "@/routes"

const service = createAPIService({
  name: Services.comments,
  setupRoutes,
})

const { app, startServer } = service

startServer()

export default app
