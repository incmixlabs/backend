import { BASE_PATH } from "@/lib/constants"
import { createI18nMiddleware } from "@/middleware/i18n"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import {
  setupAuthMiddleware,
  setupCors,
  setupOpenApi,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupOpenApi(app, BASE_PATH, "Intl Api")
  setupSentryMiddleware(app, BASE_PATH, "intl-api")
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  setupCors(app, BASE_PATH)
  setupAuthMiddleware(app, BASE_PATH)
}
