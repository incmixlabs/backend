import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import {
  createI18nMiddleware,
  setupAuthMiddleware,
  setupCors,
  setupOpenApi,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupSentryMiddleware(app, BASE_PATH, "tasks-api")
  setupAuthMiddleware(app, BASE_PATH)
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  setupCors(app, BASE_PATH)

  setupOpenApi(app, BASE_PATH, "Tasks Api")
}
