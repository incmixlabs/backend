import type { Database } from "@incmix-api/utils/db-schema"
import { getDb } from "@incmix-api/utils/fastify-bootstrap"
import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"

export const setupHealthcheckRoutes = async (app: FastifyInstance) => {
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
              status: { type: "string" },
              timestamp: { type: "string" },
              checks: {
                type: "object",
                properties: {
                  database: { type: "boolean" },
                  envVars: {
                    type: "object",
                    additionalProperties: { type: "boolean" },
                  },
                },
              },
            },
          },
          503: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              checks: {
                type: "object",
                properties: {
                  database: { type: "boolean" },
                  envVars: {
                    type: "object",
                    additionalProperties: { type: "boolean" },
                  },
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
        envVars: {
          AUTH_API_URL: !!envVars.AUTH_API_URL,
          COOKIE_NAME: !!envVars.COOKIE_NAME,
          DOMAIN: !!envVars.DOMAIN,
          INTL_API_URL: !!envVars.INTL_API_URL,
          DATABASE_URL: !!envVars.DATABASE_URL,
        },
      }

      // Check database connectivity
      try {
        const db = getDb<Database>(request)
        await db.selectFrom("tasks").selectAll().limit(1).execute()
        checks.database = true
      } catch (_error) {
        checks.database = false
      }

      const allChecksPass =
        checks.database &&
        Object.values(checks.envVars).every((v) => v === true)

      if (!allChecksPass) {
        return reply.code(503).send({
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          checks,
        })
      }

      return reply.code(200).send({
        status: "healthy",
        timestamp: new Date().toISOString(),
        checks,
      })
    }
  )
}
