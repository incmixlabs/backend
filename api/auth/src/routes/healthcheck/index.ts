import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"

export const setupHealthcheckRoutes = (app: FastifyInstance) => {
  app.get(
    "/healthcheck",
    {
      schema: {
        description: "Health check endpoint",
        tags: ["healthcheck"],
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["UP", "DOWN"] },
              service: { type: "string" },
              timestamp: { type: "string" },
              checks: {
                type: "object",
                properties: {
                  database: { type: "boolean" },
                  envVars: { type: "boolean" },
                },
              },
            },
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["UP", "DOWN"] },
              service: { type: "string" },
              timestamp: { type: "string" },
              checks: {
                type: "object",
                properties: {
                  database: { type: "boolean" },
                  envVars: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const checks = {
        database: false,
        envVars: false,
      }

      // Check database connectivity
      try {
        if (request.context?.db) {
          await request.context.db
            .selectFrom("users")
            .selectAll()
            .limit(1)
            .execute()
          checks.database = true
        }
      } catch (error) {
        console.error("Database health check failed:", error)
      }

      // Check environment variables
      try {
        const requiredEnvVars = [
          "COOKIE_NAME",
          "DOMAIN",
          "EMAIL_API_URL",
          "FRONTEND_URL",
          "DATABASE_URL",
        ]

        checks.envVars = requiredEnvVars.every((varName) => {
          const value = (envVars as any)[varName]
          return value !== undefined && value !== ""
        })
      } catch (error) {
        console.error("Environment variables check failed:", error)
      }

      const allChecksPass = Object.values(checks).every(Boolean)

      const status = allChecksPass ? "UP" : "DOWN"
      const body = {
        status,
        service: "auth-api",
        timestamp: new Date().toISOString(),
        checks,
      }
      return reply.code(allChecksPass ? 200 : 503).send(body)
    }
  )
}
