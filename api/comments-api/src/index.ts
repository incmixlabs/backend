import { createService } from "@incmix-api/utils"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { envVars } from "./env-vars"

const service = await createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "comments-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: async (app) => {
    await middlewares(app)
  },
  setupRoutes: async (app) => await routes(app),
  bindings: envVars,
})

const { app, startServer } = service

await startServer()

export default app
