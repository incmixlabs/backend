import fastify, { type FastifyInstance } from "fastify"
import { initDb } from "../db-schema"
import { createCorsMiddleware, createErrorHandler } from "../fastify-middleware"
import type { FastifyServiceConfig } from "./types"

export function createFastifyService(config: FastifyServiceConfig) {
  const app: FastifyInstance = fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
    ajv: {
      customOptions: {
        strict: false,
        removeAdditional: false,
        coerceTypes: true,
        allErrors: true,
      },
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
      openapi: {
        openapi: "3.0.0",
        info: {
          title: `${config.name.replace("-", " ").toUpperCase()} API`,
          description: `Comprehensive API documentation for ${config.name}. This API provides authentication and user management services with detailed request/response schemas and examples.`,
          version: config.version || "1.0.0",
          contact: {
            name: "API Support",
            email: "support@incmix.com",
          },
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: "Development server",
          },
        ],
        components: {
          securitySchemes: {
            cookieAuth: {
              type: "apiKey",
              in: "cookie",
              name: "incmix_session_dev",
              description: "Session cookie for authenticated requests",
            },
          },
          schemas: {
            User: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "User's unique identifier",
                  example: "user123abc",
                },
                email: {
                  type: "string",
                  format: "email",
                  description: "User's email address",
                  example: "john.doe@example.com",
                },
                fullName: {
                  type: "string",
                  description: "User's full name",
                  example: "John Doe",
                },
                emailVerified: {
                  type: "boolean",
                  description: "Whether the user's email has been verified",
                  example: true,
                },
                isSuperAdmin: {
                  type: "boolean",
                  description: "Whether the user has super admin privileges",
                  example: false,
                },
              },
            },
            Session: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Session identifier",
                  example: "session123abc",
                },
                expiresAt: {
                  type: "string",
                  format: "date-time",
                  description: "Session expiration timestamp",
                  example: "2024-12-31T23:59:59.000Z",
                },
              },
            },
            ErrorResponse: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "Error message",
                  example: "An error occurred",
                },
              },
            },
          },
        },
        tags: [
          {
            name: "Authentication",
            description:
              "User authentication endpoints including login, logout, and session management",
          },
          {
            name: "Users",
            description: "User management and information endpoints",
          },
        ],
      },
    })

    // @ts-expect-error
    app.register(import("@fastify/swagger-ui"), {
      routePrefix: `${config.basePath}/docs`,
      uiConfig: {
        docExpansion: "list",
        deepLinking: true,
        defaultModelsExpandDepth: 3,
        defaultModelExpandDepth: 3,
        displayOperationId: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        requestInterceptor:
          "(req) => { req.headers['Content-Type'] = 'application/json'; return req; }",
        responseInterceptor:
          "(res) => { console.log('API Response:', res); return res; }",
        supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
        validatorUrl: null,
        oauth2RedirectUrl: `http://localhost:${config.port}${config.basePath}/docs/oauth2-redirect.html`,
      },
      uiHooks: {
        onRequest: (_request, _reply, next) => {
          next()
        },
        preHandler: (_request, _reply, next) => {
          next()
        },
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
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

      // Reference endpoint with enhanced UI
      if (config.needSwagger !== false) {
        // @ts-expect-error
        app.register(import("@scalar/fastify-api-reference"), {
          routePrefix: `${config.basePath}/reference`,
          configuration: {
            spec: {
              url: `${config.basePath}/docs/json`,
            },
          },
        })
      }

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
