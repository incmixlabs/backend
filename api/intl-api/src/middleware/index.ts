import { BASE_PATH } from "@/lib/constants"
import { createI18nMiddleware } from "@/middleware/i18n"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { initDb } from "@incmix-api/utils/db-schema"
import { setupCors, setupSentryMiddleware } from "@incmix-api/utils/middleware"
import { env } from "hono/adapter"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  let db: ReturnType<typeof initDb> | undefined
  app.use(`${BASE_PATH}/*`, (c, next) => {
    if (!db) {
      const url = env(c).DATABASE_URL
      if (!url) {
        // Prefer a typed custom error if you have one
        throw new Error("DATABASE_URL is not set")
      }
      db = initDb(url)
    }
    c.set("db", db)
    return next()
  })
  app.use(`${BASE_PATH}/*`, (c, next) => {
    c.set("db", initDb(env(c).DATABASE_URL))
    return next()
  })

  setupSentryMiddleware(app, BASE_PATH, "intl-api")
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  setupCors(app, BASE_PATH)
}
