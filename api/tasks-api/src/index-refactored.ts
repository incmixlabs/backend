import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { setupRbac } from "@incmix-api/utils/authorization"
import { setupKvStore } from "@incmix-api/utils/middleware"
import { createService } from "@incmix-api/utils/service-bootstrap"
import { envVars } from "./env-vars"

const { app, kvStore, startServer } = createService<
  HonoApp["Bindings"],
  HonoApp["Variables"]
>({
  name: "tasks-api",
  port: envVars.PORT,
  setupMiddleware: (app) => {
    setupKvStore(app, BASE_PATH, kvStore)
    middlewares(app)
  },
  setupRBAC: () => setupRbac(app, BASE_PATH),
  setupRoutes: (app) => routes(app),
})

startServer()

export default app
