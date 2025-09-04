import { createService } from "@incmix-api/utils"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import type { HonoApp } from "@/types"
import { envVars } from "./env-vars"
import { routes } from "./routes"

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "Projects API",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: (app) => {
    middlewares(app)
  },
  needRBAC: true,
  needDB: true,
  databaseUrl: envVars.DATABASE_URL,
  setupRoutes: (app) => {
    routes(app)
  },
})

const { startServer } = service

startServer()

export default service.app
