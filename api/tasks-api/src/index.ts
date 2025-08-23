import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { setupRbac } from "@incmix-api/utils/authorization"
import { setupKvStore } from "@incmix-api/utils/middleware"
import { createService } from "@incmix-api/utils/service-bootstrap"
import { envVars } from "./env-vars"

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "tasks-api",
  port: envVars.PORT,
  setupMiddleware: (app) => {
    middlewares(app)
  },
  setupRoutes: (app) => routes(app),
})

const { app, kvStore, startServer } = service

// Setup KV store after service creation
setupKvStore(app, BASE_PATH, kvStore)
setupRbac(app, BASE_PATH)

startServer()

export default app
