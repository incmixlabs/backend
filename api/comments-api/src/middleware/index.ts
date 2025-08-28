import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import {
  createAuthMiddleware,
  createI18nMiddleware,
  setupCors,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"
import { compress } from "hono/compress"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  app.use("*", compress({ encoding: "gzip" }))
  setupSentryMiddleware(app, BASE_PATH, "comments-api")

  app.use(`${BASE_PATH}/*`, createAuthMiddleware())
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  setupCors(app, BASE_PATH)
}
