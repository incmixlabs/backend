import { Services } from "@incmix-api/utils/env-config"
import { createAPIService } from "@incmix-api/utils/fastify-bootstrap"
import { setupRoutes } from "@/routes"

const service = await createAPIService({
  name: Services.bff,
  setupRoutes,
})

const { app, startServer } = service

startServer()

export default app
