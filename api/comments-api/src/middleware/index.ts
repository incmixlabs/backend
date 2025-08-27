import type { OpenAPIHono } from "@hono/zod-openapi"
import { initDb } from "@incmix-api/utils/db-schema"
import {
  createAuthMiddleware,
  createI18nMiddleware,
  setupCors,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"
import { env } from "hono/adapter"
import { compress } from "hono/compress"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  app.use("*", compress({ encoding: "gzip" }))
  setupSentryMiddleware(app, BASE_PATH, "comments-api")

  app.use(`${BASE_PATH}/*`, createAuthMiddleware())
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  setupCors(app, BASE_PATH)

  app.use(`${BASE_PATH}/*`, async (c, next) => {
    const db = initDb(env(c).DATABASE_URL)
    c.set("db", db)
    await next()
  })
}
