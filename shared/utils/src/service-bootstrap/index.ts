import fastifyCookie from "@fastify/cookie"
import fastifyHelmet from "@fastify/helmet"
import fastifySensible from "@fastify/sensible"
import { setupRbac } from "@incmix-api/utils/authorization"
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { setupKvStore } from "@/middleware"
import { KVStore } from "../kv-store"
import { shutdownRedis } from "../middleware/redis"
import { setupOpenApi } from "./open-api"

export interface ServiceConfig<
  TBindings extends object = Record<string, unknown>,
  TVariables extends object = Record<string, unknown>,
> {
  name: string
  version?: string
  port: number
  basePath: string
  setupMiddleware?: (app: FastifyInstance) => Promise<void> | void
  setupRoutes?: (app: FastifyInstance) => Promise<void> | void
  needRBAC?: boolean
  onBeforeStart?: () => Promise<void>
  bindings?: TBindings
  variables?: TVariables
  fastifyOptions?: FastifyServerOptions
}

export async function createService<
  TBindings extends object = Record<string, unknown>,
  TVariables extends object = Record<string, unknown>,
>(config: ServiceConfig<TBindings, TVariables>) {
  const app = Fastify({
    logger: true,
    ...config.fastifyOptions,
  }).withTypeProvider<ZodTypeProvider>()

  // Global error handler for better error handling
  app.setErrorHandler((error, request, reply) => {
    app.log.error(
      {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
      },
      "Request error"
    )

    return reply.status(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: error.message,
    })
  })

  // Initialize KVStore
  const kvStore = new KVStore({ name: config.name })
  await setupKvStore(app, config.basePath, kvStore)

  // Register core plugins
  await app.register(fastifyCookie)
  await app.register(fastifyHelmet)
  await app.register(fastifySensible)

  // Setup middleware if provided
  if (config.setupMiddleware) {
    await config.setupMiddleware(app)
  }

  // Setup RBAC if provided
  if (config.needRBAC) {
    await setupRbac(app, config.basePath)
  }

  await setupOpenApi(app, config.basePath, config.name)

  // Setup routes if provided
  if (config.setupRoutes) {
    await config.setupRoutes(app)
  }

  // Start server
  const startServer = async () => {
    if (config.onBeforeStart) {
      await config.onBeforeStart()
    }

    try {
      await app.listen({ port: config.port, host: "0.0.0.0" })
      console.log(`${config.name} running on port ${config.port}`)
    } catch (err) {
      app.log.error(err)
      process.exit(1)
    }

    // Setup graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`)

      try {
        await app.close()
        console.log("Server closed")

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

export type ServiceApp = FastifyInstance

export type ServiceContext = FastifyInstance

// Re-export types from types.ts
export type { CommonBindings, CommonVariables, FastifyApp } from "./types"
