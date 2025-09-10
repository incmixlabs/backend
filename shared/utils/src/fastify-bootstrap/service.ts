import fastify, { type FastifyInstance } from "fastify"
import { initDb } from "../db-schema"
import { createCorsMiddleware, createErrorHandler } from "../fastify-middleware"
import type { FastifyServiceConfig } from "./types"

export function createFastifyService(config: FastifyServiceConfig) {
  const app: FastifyInstance = fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
  })

  // Setup error handler
  app.setErrorHandler(createErrorHandler())

  // Setup CORS if configured
  if (config.cors) {
    app.addHook("onRequest", createCorsMiddleware(config.cors))
  }

  // Setup database if needed
  if (config.needDb !== false) {
    if (!config.bindings?.DATABASE_URL) {
      throw new Error("DATABASE_URL is required")
    }

    const db = initDb(config.bindings.DATABASE_URL)

    app.addHook("onRequest", async (request, _reply) => {
      if (!request.context) {
        request.context = {}
      }
      request.context.db = db
    })
  }

  // Setup Swagger documentation if enabled
  if (config.needSwagger !== false) {
    app.register(import("@fastify/swagger"), {
      swagger: {
        info: {
          title: config.name,
          description: `API documentation for ${config.name}`,
          version: config.version || "1.0.0",
        },
        host: `localhost:${config.port}`,
        schemes: ["http", "https"],
        consumes: ["application/json"],
        produces: ["application/json"],
        basePath: config.basePath,
      },
    })

    app.register(import("@fastify/swagger-ui"), {
      routePrefix: `${config.basePath}/docs`,
      uiConfig: {
        docExpansion: "full",
        deepLinking: false,
      },
    })
  }

  // Setup custom middleware if provided
  const setupMiddleware = async () => {
    if (config.setupMiddleware) {
      await config.setupMiddleware(app)
    }
  }

  // Setup routes if provided
  const setupRoutes = async () => {
    if (config.setupRoutes) {
      await config.setupRoutes(app)
    }
  }

  // Health check endpoint
  app.get(`${config.basePath}/health`, async (_request, _reply) => {
    return {
      status: "ok",
      service: config.name,
      timestamp: new Date().toISOString(),
    }
  })

  // Start server
  const startServer = async () => {
    try {
      if (config.onBeforeStart) {
        await config.onBeforeStart()
      }

      await setupMiddleware()
      await setupRoutes()

      await app.listen({
        port: config.port,
        host: "0.0.0.0",
      })

      console.log(`${config.name} running on port ${config.port}`)
      console.log(
        `API documentation available at http://localhost:${config.port}${config.basePath}/docs`
      )

      if (config.onAfterStart) {
        await config.onAfterStart()
      }

      // Setup graceful shutdown
      const gracefulShutdown = async (signal: string) => {
        console.log(`\nReceived ${signal}. Starting graceful shutdown...`)

        try {
          await app.close()
          console.log("Server shutdown completed")
          process.exit(0)
        } catch (error) {
          console.error("Error during graceful shutdown:", error)
          process.exit(1)
        }
      }

      // Handle shutdown signals
      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
      process.on("SIGINT", () => gracefulShutdown("SIGINT"))
    } catch (error) {
      console.error("Failed to start server:", error)
      process.exit(1)
    }
  }

  return {
    app,
    startServer,
  }
}
