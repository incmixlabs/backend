import { createAPIService } from "@incmix-api/utils/fastify-bootstrap"
import { Services } from "@/env-vars"
import { setupRoutes } from "@/routes"
import "./types"

const service = await createAPIService({
  name: Services.org,
  setupRoutes,
})

const { app, startServer } = service

startServer()

export default app
