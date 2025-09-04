import type { OpenAPIHono } from "@hono/zod-openapi"
import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import { envVars } from "../env-vars"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "org-api",
    databaseUrl: envVars.DATABASE_URL,
    corsFirst: true,
  })
}
