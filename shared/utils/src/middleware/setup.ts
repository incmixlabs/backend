import fastifyCompress from "@fastify/compress"
import { initDb } from "@incmix-api/utils/db-schema"
import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyReply,
  FastifyRequest,
} from "fastify"
import fp from "fastify-plugin"
import { envVars } from "../env-config"
import { createAuthMiddleware } from "./auth"
import { setupCors } from "./cors"
import { createI18nMiddleware } from "./i18n"
import { setupRedisMiddleware } from "./redis"
import { setupSentryMiddleware } from "./sentry"

declare module "fastify" {
  interface FastifyRequest {
    db: KyselyDb | null
  }
}

export interface MiddlewareConfig {
  basePath: string
  serviceName: string
  databaseUrl?: string
  customAuthMiddleware?: FastifyPluginCallback
  mockMiddleware?: FastifyPluginCallback
  mockData?: boolean
  corsFirst?: boolean
  skipAuth?: boolean
  useRedis?: boolean
  useCompression?: boolean
  customI18nMiddleware?: () => FastifyPluginCallback
}

export function createReferenceEndpointCheck(basePath: string) {
  const normalize = (p: string) => {
    // Remove trailing slashes without using regex to avoid ReDoS vulnerability
    let normalizedPath = p.startsWith("/") ? p : `/${p}`
    while (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
      normalizedPath = normalizedPath.slice(0, -1)
    }
    return normalizedPath
  }
  return async (request: FastifyRequest): Promise<boolean> => {
    const origin = new URL(request.url).origin
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

export async function setupApiMiddleware(
  app: FastifyInstance,
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
    await app.register(fastifyCompress, { global: true })
  }

  // Setup Sentry middleware first for error tracking
  await setupSentryMiddleware(app, basePath, serviceName)

  // Setup CORS based on preference, or always if mock middleware is enabled
  if (corsFirst || (mockData && mockMiddleware)) {
    await setupCors(app, basePath)
  }

  // Setup database middleware early so other middleware can access it
  if (databaseUrl) {
    // Initialize database connection once
    const db = initDb(databaseUrl)

    await app.register(
      fp(async (fastify) => {
        fastify.decorateRequest("db", null)

        fastify.addHook("onRequest", async (request, reply) => {
          if (!db) {
            console.error(`DATABASE_URL is not configured for ${serviceName}`)
            reply.code(500).send("Server misconfigured: missing DATABASE_URL")
            return
          }
          request.db = db
        })
      })
    )
  }

  // Add mock middleware if enabled
  if (mockData && mockMiddleware) {
    console.log("🎭 MOCK_DATA", mockData)
    console.log(
      "🎭 MOCK MODE ENABLED - Using mock data instead of real database"
    )
    await app.register(mockMiddleware)
  }

  // Setup i18n middleware (custom or default)
  if (customI18nMiddleware) {
    await app.register(customI18nMiddleware())
  } else {
    await app.register(createI18nMiddleware())
  }

  // Setup auth middleware (custom or default) unless explicitly skipped
  if (!skipAuth) {
    if (customAuthMiddleware) {
      await app.register(customAuthMiddleware)
    } else {
      await app.register(createAuthMiddleware())
    }
  }

  // Setup CORS after auth if not done before (and mock middleware isn't short-circuiting)
  if (!corsFirst && !(mockData && mockMiddleware)) {
    await setupCors(app, basePath)
  }

  // Setup Redis middleware if needed
  if (useRedis) {
    await setupRedisMiddleware(app, basePath)
  }
}
