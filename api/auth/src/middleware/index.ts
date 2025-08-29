import { authMiddleware } from "@/auth/middleware"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { initDb } from "@incmix-api/utils/db-schema"
import {
  createI18nMiddleware,
  setupCors,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"
import { envVars } from "../env-vars"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupCors(app, BASE_PATH)
  setupSentryMiddleware(app, BASE_PATH, "auth")
  app.use(`${BASE_PATH}/*`, (c, next) => {
    c.set("db", initDb(envVars.DATABASE_URL))
    return next()
  })
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())

  // Use custom authentication middleware
  app.use(`${BASE_PATH}/*`, authMiddleware)
}
