import type { OpenAPIHono } from "@hono/zod-openapi"
import { initDb } from "@incmix-api/utils/db-schema"
import type { Context } from "hono"
import { compress } from "hono/compress"
import { envVars } from "../env-config"
import { createAuthMiddleware } from "./auth"
import { setupCors } from "./cors"
import { createI18nMiddleware } from "./i18n"
import { setupRedisMiddleware } from "./redis"
import { setupSentryMiddleware } from "./sentry"
import type { MiddlewareHandler } from "hono"

export interface MiddlewareConfig {
  basePath: string
  serviceName: string
  databaseUrl?: string
  customAuthMiddleware?: MiddlewareHandler
  mockMiddleware?: MiddlewareHandler
  mockData?: boolean
  corsFirst?: boolean
  skipAuth?: boolean
  useRedis?: boolean
  useCompression?: boolean
  customI18nMiddleware?: () => MiddlewareHandler
}

export function createReferenceEndpointCheck(basePath: string) {
  const normalize = (p: string) =>
    p.startsWith("/") ? p.replace(/\/+$/, "") : `/${p.replace(/\/+$/, "")}`
  return async (c: Context): Promise<boolean> => {
    const origin = new URL(c.req.url).origin
    const referenceUrl = `${origin}${normalize(basePath)}/reference`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), envVars.TIMEOUT_MS)
    try {
      const response = await fetch(referenceUrl, {
        method: "GET",
        signal: controller.signal,
      })
      return response.ok
    } catch (error) {
      console.error(
        `Reference endpoint check failed for ${basePath}/reference:`,
        error
      )
      return false
    } finally {
      clearTimeout(timer)
    }
  }
}

export function setupApiMiddleware<T extends { Bindings: any; Variables: any }>(
  app: OpenAPIHono<T>,
  config: MiddlewareConfig
) {
  const {
    basePath,
    serviceName,
    databaseUrl,
    customAuthMiddleware,
    mockMiddleware,
    mockData,
    corsFirst = true,
    skipAuth = false,
    useRedis = false,
    useCompression = false,
    customI18nMiddleware,
  } = config

  // Setup compression if enabled
  if (useCompression) {
    app.use("*", compress({ encoding: "gzip" }))
  }

  // Setup Sentry middleware first for error tracking
  setupSentryMiddleware(app, basePath, serviceName)

  // Setup CORS based on preference, or always if mock middleware is enabled
  if (corsFirst || (mockData && mockMiddleware)) {
    setupCors(app, basePath)
  }

  // Setup database middleware early so other middleware can access it
  if (databaseUrl) {
    // Initialize database connection once
    const db = initDb(databaseUrl)

    app.use(`${basePath}/*`, async (c, next) => {
      if (!db) {
        console.error(`DATABASE_URL is not configured for ${serviceName}`)
        return c.text("Server misconfigured: missing DATABASE_URL", 500)
      }
      c.set("db", db)
      await next()
    })
  }

  // Add mock middleware if enabled
  if (mockData && mockMiddleware) {
    console.log("🎭 MOCK_DATA", mockData)
    console.log(
      "🎭 MOCK MODE ENABLED - Using mock data instead of real database"
    )
    app.use(`${basePath}/*`, mockMiddleware)
  }

  // Setup i18n middleware (custom or default)
  if (customI18nMiddleware) {
    app.use(`${basePath}/*`, customI18nMiddleware())
  } else {
    app.use(`${basePath}/*`, createI18nMiddleware())
  }

  // Setup auth middleware (custom or default) unless explicitly skipped
  if (!skipAuth) {
    if (customAuthMiddleware) {
      app.use(`${basePath}/*`, customAuthMiddleware)
    } else {
      app.use(`${basePath}/*`, createAuthMiddleware())
    }
  }

  // Setup CORS after auth if not done before (and mock middleware isn't short-circuiting)
  if (!corsFirst && !(mockData && mockMiddleware)) {
    setupCors(app, basePath)
  }

  // Setup Redis middleware if needed
  if (useRedis) {
    setupRedisMiddleware(app, basePath)
  }
}
