import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import type { AjvOpenApiHono } from "@incmix-api/utils/openapi/ajv-openapi"
import { authMiddleware } from "@/auth/middleware"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import { envVars } from "../env-vars"

export const middlewares = (app: AjvOpenApiHono<HonoApp>) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "auth",
    databaseUrl: envVars.DATABASE_URL,
    customAuthMiddleware: authMiddleware,
    corsFirst: true,
  })
}
