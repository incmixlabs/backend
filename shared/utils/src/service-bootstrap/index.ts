import { serve } from "@hono/node-server"
import { OpenAPIHono } from "@hono/zod-openapi"
import type { Context } from "hono"
import { logger } from "hono/logger"
import type { Kysely } from "kysely"
import { type Database, initDb } from "../db-schema"
import { KVStore } from "../kv-store"
import { setupKvStore } from "../middleware"
import { shutdownRedis } from "../middleware/redis"
import type { ServiceBindings, ServiceVariables } from "../types/service"
import { setupOpenApi } from "./open-api"

type BaseBindings = {
  DATABASE_URL?: string
}

type BaseVariables = {
  db?: Kysely<Database>
}
export interface ServiceConfig<
  TBindings extends BaseBindings,
  TVariables extends BaseVariables,
> {
  name: string
  version?: string
  port: number
  basePath: string
  setupMiddleware?: (
    app: OpenAPIHono<{ Bindings: TBindings; Variables: TVariables }>
  ) => void
  setupRoutes?: (
    app: OpenAPIHono<{ Bindings: TBindings; Variables: TVariables }>
  ) => void
  needRBAC?: boolean
  needDb?: boolean
  onBeforeStart?: () => Promise<void>
  bindings?: TBindings
  variables?: TVariables
}

export function createService<
  TBindings extends BaseBindings,
  TVariables extends BaseVariables,
>(config: ServiceConfig<TBindings, TVariables>) {
  const app = new OpenAPIHono<{
    Bindings: TBindings
    Variables: TVariables
  }>()

  // Setup database if needed
  if (config.needDb !== false) {
    if (!config.bindings?.DATABASE_URL) {
      throw new Error("DATABASE_URL is required")
    }
    const db = initDb(config.bindings.DATABASE_URL)
    app.use(`${config.basePath}/*`, async (c, next) => {
      c.set("db", db)
      await next()
    })
  }

  // Initialize KVStore
  const kvStore = new KVStore({ name: config.name })
  setupKvStore(app, config.basePath, kvStore)
  // Setup logger
  app.use(logger())

  // Setup middleware if provided
  if (config.setupMiddleware) {
    config.setupMiddleware(app)
  }

  setupOpenApi(
    app,
    config.basePath,
    config.name,
    `This is OpenAPI Docs for ${config.name}`
  )
  // Setup routes if provided
  if (config.setupRoutes) {
    config.setupRoutes(app)
  }

  // Start server
  const startServer = async () => {
    if (config.onBeforeStart) {
      await config.onBeforeStart()
    }

    serve({
      fetch: app.fetch,
      port: config.port,
    })

    console.log(`${config.name} running on port ${config.port}`)

    // Setup graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`)

      try {
        // Shutdown Redis client
        await shutdownRedis()
        console.log("Redis client shutdown completed")

        // Exit gracefully
        process.exit(0)
      } catch (error) {
        console.error("Error during graceful shutdown:", error)
        process.exit(1)
      }
    }

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
  }

  return {
    app,
    kvStore,
    startServer,
  }
}

export type ServiceApp<
  TBindings extends ServiceBindings = ServiceBindings,
  TVariables extends ServiceVariables = ServiceVariables,
> = OpenAPIHono<{
  Bindings: TBindings
  Variables: TVariables
}>

export type ServiceContext<
  TBindings extends ServiceBindings = ServiceBindings,
  TVariables extends ServiceVariables = ServiceVariables,
> = Context<{
  Bindings: TBindings
  Variables: TVariables
}>
