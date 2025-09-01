import { BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import healthcheckRoutes from "@/routes/healthcheck"
import projectRoutes from "@/routes/projects"
import tasksRoutes from "@/routes/tasks"
import type { HonoApp } from "@/types"
import { createService } from "@incmix-api/utils"
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
  setupRoutes: (app) => {
    routes(app)
  },
})

const { startServer } = service

startServer()

export default service.app
