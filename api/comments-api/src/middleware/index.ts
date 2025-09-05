import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import type { AjvOpenApiHono } from "@incmix-api/utils/openapi/ajv-openapi"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import { envVars } from "../env-vars"

export const middlewares = (app: AjvOpenApiHono<HonoApp>) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "comments-api",
    databaseUrl: envVars.DATABASE_URL,
    useCompression: true,
  })
}
