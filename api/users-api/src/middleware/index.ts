import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { initDb } from "@incmix-api/utils/db-schema"
import {
  createAuthMiddleware,
  createI18nMiddleware,
  setupCors,
  setupOpenApi,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"
import { env } from "hono/adapter"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupSentryMiddleware(app, BASE_PATH, "users-api")
  setupCors(app, BASE_PATH)

  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  app.use(`${BASE_PATH}/*`, createAuthMiddleware())
  setupOpenApi(app, BASE_PATH, "Users Api")

  app.use(`${BASE_PATH}/*`, async (c, next) => {
    const db = initDb(env(c).DATABASE_URL)
    c.set("db", db)
    await next()
  })
}
