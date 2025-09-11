import { createFastifyService } from "@incmix-api/utils/fastify-bootstrap"
import { envVars } from "./env-vars"
import { setupMiddleware } from "./middleware"
import { setupRoutes } from "./routes"

const service = createFastifyService({
  name: "bff-web",
  port: envVars.PORT,
  basePath: "/api",
  setupMiddleware,
  setupRoutes,
  needDb: false,
  needSwagger: false,
  bindings: envVars,
  cors: {
    origin: true,
    credentials: true,
  },
})

const { app, startServer } = service

startServer()

export default app
