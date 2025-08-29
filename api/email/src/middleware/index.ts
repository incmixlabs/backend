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

// Create singleton DB instance at module level
const db = (() => {
  const url = envVars.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not defined for email-api")
  }
  return initDb(url)
})()

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupCors(app, BASE_PATH)
  setupSentryMiddleware(app, BASE_PATH, "email-api")
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())

  app.use(`${BASE_PATH}/*`, async (c, next) => {
    c.set("db", db)
    await next()
  })
}
