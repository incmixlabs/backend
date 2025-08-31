import { BASE_PATH } from "@/lib/constants"

import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import type { HonoApp } from "@/types"
import { createService } from "@incmix-api/utils"
import { envVars } from "./env-vars"

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "projects-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: (app) => {
    middlewares(app)
  },
  needRBAC: true,
  setupRoutes: (app) => routes(app),
})

const { app, startServer } = service

// Mount tasks routes AFTER OpenAPI setup to exclude them from main documentation
// Tasks have their own dedicated API documentation at /api/projects/tasks/reference
import tasksRoutes from "./routes/tasks"
app.route(`${BASE_PATH}/tasks`, tasksRoutes)

startServer()

export default app
