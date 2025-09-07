import { createService } from "@incmix-api/utils"
import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { Bindings } from "@/types"
import { envVars } from "./env-vars"

const service = await createService<Bindings>({
  name: "files-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: middlewares,
  setupRoutes: routes,
  bindings: envVars,
})

const { app, startServer } = service

await startServer()

export default app
