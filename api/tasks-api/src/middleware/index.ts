import { envVars } from "@/env-vars"
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
import { mockMiddleware } from "./mock"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupSentryMiddleware(app, BASE_PATH, "tasks-api")

  // Add mock middleware before auth if MOCK_DATA is true
  if (envVars.MOCK_DATA) {
    console.log("🎭 MOCK_DATA", envVars.MOCK_DATA)
    console.log(
      "🎭 MOCK MODE ENABLED - Using mock data instead of real database"
    )
    app.use(`${BASE_PATH}/*`, mockMiddleware)
  }

  app.use(`${BASE_PATH}/*`, createAuthMiddleware())
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  setupCors(app, BASE_PATH)

  app.use(`${BASE_PATH}/*`, async (c, next) => {
    const db = initDb(envVars.DATABASE_URL)
    c.set("db", db)
    await next()
  })
}
