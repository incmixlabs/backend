import type { OpenAPIHono } from "@hono/zod-openapi"
import {
  createI18nMiddleware,
  setupCors,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"
import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
/*
export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupCors(app, BASE_PATH)
  setupSentryMiddleware(app, BASE_PATH, "auth")
  app.use(`${BASE_PATH}/*`, (c, next) => {
    c.set("db", initDb(env(c).DATABASE_URL))
    return next()
  })
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())

  // Use custom authentication middleware
  app.use(`${BASE_PATH}/*`, authMiddleware)
}*/

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupCors(app, BASE_PATH)
  app.use(`${BASE_PATH}/*`, (_c, next) => {
    // db attach (singleton as above)
    return next()
  })
  setupSentryMiddleware(app, BASE_PATH, "intl-api")
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
}
