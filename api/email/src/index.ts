import { createAPIService } from "@incmix-api/utils/fastify-bootstrap"
import { Services } from "@/env-vars"
import { setupRoutes } from "@/routes"

const service = await createAPIService({
  name: Services.email,
  setupRoutes,
})

const { app, startServer } = service

startServer()

export default app
