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
import { env } from "hono/adapter"
import { mockMiddleware } from "./mock"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupSentryMiddleware(app, BASE_PATH, "tasks-api")

  // Add mock middleware before auth if MOCK_ENV is true
  if (envVars.MOCK_ENV) {
    console.log("🎭 MOCK_ENV", envVars.MOCK_ENV)
    console.log(
      "🎭 MOCK MODE ENABLED - Using mock data instead of real database"
    )
    app.use(`${BASE_PATH}/*`, mockMiddleware)
  }

  app.use(`${BASE_PATH}/*`, createAuthMiddleware())
  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  setupCors(app, BASE_PATH)
}
