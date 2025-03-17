import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import {
  createAuthMiddleware,
  createI18nMiddleware,
  setupCors,
  setupOpenApi,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"
import { compress } from "hono/compress"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  app.use("*", compress({ encoding: "gzip" }))
  setupSentryMiddleware(app, BASE_PATH, "org-api")

  setupCors(app, BASE_PATH)

  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  app.use(`${BASE_PATH}/*`, createAuthMiddleware())
  setupOpenApi(app, BASE_PATH, "Org Api")
}
