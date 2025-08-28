import { createService } from "@incmix-api/utils"
import { envVars } from "./env-vars"
import { BASE_PATH } from "./lib/constants"
import { middlewares } from "./middleware"
import { routes } from "./routes"
import type { HonoApp } from "./types"

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "location-api",
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
