export * from "./casl"

import type { Env } from "hono"
import type { AjvOpenApiHono } from "../openapi/ajv-openapi"
import { PermissionService } from "./casl"

export function setupRbac<T extends Env>(
  app: AjvOpenApiHono<T>,
  basePath: string,
  rbac?: PermissionService
) {
  app.use(`${basePath}/*`, (c, next) => {
    // Skip RBAC for documentation routes
    const path = c.req.path
    const publicPaths = [
      "/openapi.json",
      "/reference",
      "/tasks/openapi.json",
      "/tasks/reference",
    ]

    const isPublicPath = publicPaths.some((publicPath) =>
      path.endsWith(publicPath)
    )

    if (isPublicPath) {
      // Set a dummy RBAC that won't be used
      c.set("rbac", {} as PermissionService)
      return next()
    }

    if (!rbac) {
      c.set("rbac", new PermissionService(c))
      return next()
    }

    c.set("rbac", rbac)
    return next()
  })
}
