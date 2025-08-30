import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { createService } from "@incmix-api/utils"

import { envVars } from "./env-vars"

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "tasks-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: (app) => {
    middlewares(app)
  },
  setupRoutes: (app) => routes(app),
})

const { app, startServer } = service

// Only start the server if not in test environment
if (process.env.NODE_ENV !== "test") {
  startServer()
}

export default app
