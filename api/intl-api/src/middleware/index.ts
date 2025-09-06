import type { OpenAPIHono } from "@hono/zod-openapi"
import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import { BASE_PATH } from "@/lib/constants"
import { createI18nMiddleware } from "@/middleware/i18n"
import type { HonoApp } from "@/types"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupApiMiddleware(app, {
    basePath: BASE_PATH,
    serviceName: "intl-api",
    skipAuth: true,
    customI18nMiddleware: createI18nMiddleware,
  })
}
