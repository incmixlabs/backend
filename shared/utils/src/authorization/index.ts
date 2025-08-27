export * from "./casl"

import type { OpenAPIHono } from "@hono/zod-openapi"
import type { Env } from "hono"
import { PermissionService } from "./casl"

export function setupRbac<T extends Env>(
  app: OpenAPIHono<T>,
  basePath: string,
  rbac?: PermissionService
) {
  app.use(`${basePath}/*`, (c, next) => {
    if (!rbac) {
      c.set("rbac", new PermissionService(c))
      return next()
    }

    c.set("rbac", rbac)
    return next()
  })
}
