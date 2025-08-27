import type { OpenAPIHono } from "@hono/zod-openapi"
import {
  createAuthMiddleware,
  createI18nMiddleware,
  setupCors,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupSentryMiddleware(app, BASE_PATH, "files-api")
  setupCors(app, BASE_PATH)

  app.use(`${BASE_PATH}/*`, createAuthMiddleware())
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
}
