import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { initDb } from "@incmix-api/utils/db-schema"
import {
  createAuthMiddleware,
  createI18nMiddleware,
  setupCors,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"
import { envVars } from "../env-vars"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupSentryMiddleware(app, BASE_PATH, "genai-api")

  app.use(`${BASE_PATH}/*`, createAuthMiddleware())
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  setupCors(app, BASE_PATH)

  app.use(`${BASE_PATH}/*`, async (c, next) => {
    const databaseUrl = envVars.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not defined")
    }
    const db = initDb(databaseUrl)
    c.set("db", db)
    await next()
  })
}
