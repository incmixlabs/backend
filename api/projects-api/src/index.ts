import { BASE_PATH } from "@/lib/constants"

import { middlewares } from "@/middleware"
import healthcheckRoutes from "@/routes/healthcheck"
import projectRoutes from "@/routes/projects"
import tasksRoutes from "@/routes/tasks"
import type { HonoApp } from "@/types"
import { createService } from "@incmix-api/utils"
import { envVars } from "./env-vars"

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "Projects API",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: (app) => {
    middlewares(app)
  },
  needRBAC: true,
  setupRoutes: (app) => {
    // Register only projects and healthcheck routes for main API
    app.route(`${BASE_PATH}/healthcheck`, healthcheckRoutes)
    app.route(BASE_PATH, projectRoutes)

    // Mount tasks routes with proper OpenAPI support
    app.route(`${BASE_PATH}/tasks`, tasksRoutes)

    // Override the OpenAPI to add description with link to Tasks API
    app.doc(`${BASE_PATH}/openapi.json`, (_c) => {
      return {
        openapi: "3.0.0",
        info: {
          version: "1.0.0",
          title: "Projects API",
          description: `Projects API documentation.

**📋 Tasks API:** Tasks have been moved to a separate API for better organization.  
**Access Tasks API at:** [/api/projects/tasks/reference](/api/projects/tasks/reference)`,
        },
      }
    })
  },
})

const { startServer } = service

startServer()

export default service.app
