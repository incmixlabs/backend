import { createService } from "@incmix-api/utils"
import { BASE_PATH } from "@/lib/constants"
import { envVars } from "./env-vars"
import { middlewares } from "./middleware"
import { routes } from "./routes"
import type { HonoApp } from "./types"

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "email-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: (app) => {
    middlewares(app)
  },
  needDB: true,
  databaseUrl: envVars.DATABASE_URL,
  setupRoutes: (app) => routes(app),
})

const { app, startServer } = service

startServer()

export default app
