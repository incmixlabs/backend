import { BASE_PATH, PERMISSIONS_BASE_PATH } from "@/lib/constants"
import { middlewares } from "@/middleware"
import { routes } from "@/routes"
import { permissionsReferenceRoutes } from "@/routes/permissions"
import type { HonoApp } from "@/types"
import { createService } from "@incmix-api/utils"
import { PermissionService } from "@incmix-api/utils/authorization"

import { envVars } from "./env-vars"

const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
  name: "org-api",
  port: envVars.PORT,
  basePath: BASE_PATH,
  setupMiddleware: (app) => {
    middlewares(app)

    // Custom RBAC setup that excludes reference endpoints
    app.use(`${BASE_PATH}/*`, (c, next) => {
      const path = c.req.path
      // Skip RBAC for reference/documentation endpoints
      if (path.includes("/reference") || path.includes("/openapi.json")) {
        return next()
      }
      // Apply RBAC to all other routes
      c.set("rbac", new PermissionService(c))
      return next()
    })
  },
  needRBAC: false, // Disable default RBAC since we're doing it manually
  setupRoutes: (app) => {
    routes(app)

    // Mount permissions reference routes AFTER main routes and OpenAPI setup
    // Use mount() instead of route() to truly isolate from main OpenAPI spec
    app.mount(
      `${BASE_PATH}/permissions/reference`,
      permissionsReferenceRoutes.fetch
    )
  },
})

const { app, startServer } = service

startServer()

export default app
