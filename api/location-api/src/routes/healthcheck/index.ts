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
                  redis: { type: "boolean" },
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
                  redis: { type: "boolean" },
                  envVars: { type: "boolean" },
                },
              },
            },
          },
        },
      },
    },
    (_request, reply) => {
      const checks = {
        redis: false,
        envVars: false,
      }

      // Check Redis connectivity
      try {
        // TODO: Add Redis connection check when redis is available
        checks.redis = false
      } catch (error) {
        console.error("Redis health check failed:", error)
      }

      // Check environment variables
      try {
        const requiredEnvVars = [
          "DOMAIN",
          "INTL_API_URL",
          "LOCATION_API_KEY",
          "LOCATION_URL",
          "WEATHER_API_KEY",
          "WEATHER_URL",
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
        service: "location-api",
        timestamp: new Date().toISOString(),
        checks,
      }
      return reply.code(allChecksPass ? 200 : 503).send(body)
    }
  )
}
