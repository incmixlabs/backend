import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import type { AjvOpenApiHono } from "@incmix-api/utils/openapi/ajv-openapi"
import { BASE_PATH } from "@/lib/constants"
import { createI18nMiddleware } from "@/middleware/i18n"
import type { HonoApp } from "@/types"
import { envVars } from "../env-vars"

export const middlewares = (app: AjvOpenApiHono<HonoApp>) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "intl-api",
    databaseUrl: envVars.DATABASE_URL,
    skipAuth: true,
    customI18nMiddleware: createI18nMiddleware,
  })
}
