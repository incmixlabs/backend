import type { OpenAPIHono } from "@hono/zod-openapi"
import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import { authMiddleware } from "@/auth/middleware"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "auth",
    customAuthMiddleware: authMiddleware,
    corsFirst: true,
  })
}
