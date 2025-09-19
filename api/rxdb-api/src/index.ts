import { createAPIService } from "@incmix-api/utils/fastify-bootstrap"
import { setupRoutes } from "@/routes"
import { Services } from "./env-vars"

const service = await createAPIService({
  name: Services.rxdb,
  setupRoutes,
})

const { app, startServer } = service

startServer()

export default app
