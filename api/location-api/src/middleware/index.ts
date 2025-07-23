import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import {
  createI18nMiddleware,
  setupCors,
  setupOpenApi,
  setupRedisMiddleware,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupCors(app, BASE_PATH)

  setupSentryMiddleware(app, BASE_PATH, "location-api")

  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  // setupRedisMiddleware(app, BASE_PATH)
  setupOpenApi(app, BASE_PATH, "Location Api")
}
