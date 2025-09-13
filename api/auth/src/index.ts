import { createAPIService } from "@incmix-api/utils/fastify-bootstrap"

import { setupRoutes } from "@/routes"
import { Services } from "./env-vars"

const service = createAPIService({
  name: Services.auth,
  setupRoutes
})

const { app, startServer } = service

startServer()

export default app
