import { createService } from "@incmix-api/utils"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { envVars } from "./env-vars"

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "comments-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: (app) => {
    middlewares(app)
  },
  setupRoutes: (app) => routes(app),
  bindings: envVars,
})

const { app, startServer } = service

startServer()

export default app
