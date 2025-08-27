import { BASE_PATH } from "@/lib/constants"
import { createI18nMiddleware } from "@/middleware/i18n"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { initDb } from "@incmix-api/utils/db-schema"
import { setupCors, setupSentryMiddleware } from "@incmix-api/utils/middleware"
import { envVars } from "../env-vars"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  app.use(`${BASE_PATH}/*`, (c, next) => {
    c.set("db", initDb(envVars.DATABASE_URL))
    return next()
  })

  setupSentryMiddleware(app, BASE_PATH, "intl-api")
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  setupCors(app, BASE_PATH)
}
