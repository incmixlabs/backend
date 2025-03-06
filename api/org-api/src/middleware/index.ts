import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import {
  createI18nMiddleware,
  createAuthMiddleware,
  setupCors,
  setupOpenApi,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupSentryMiddleware(app, BASE_PATH, "org-api")

  setupCors(app, BASE_PATH)

  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  app.use(`${BASE_PATH}/*`, createAuthMiddleware())
  setupOpenApi(app, BASE_PATH, "Org Api")
}
