import { BASE_PATH } from "@/lib/constants"
import { createI18nMiddleware } from "@/middleware/i18n"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import { envVars } from "../env-vars"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "intl-api",
    databaseUrl: envVars.DATABASE_URL,
    skipAuth: true,
    customI18nMiddleware: createI18nMiddleware,
  })
}
