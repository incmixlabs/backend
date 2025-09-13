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
              reason: { type: "string" },
            },
          },
        },
      } as any,
    },
    async (request, reply) => {
      try {
        let status = "UP"
        const missing: string[] = []
        const checkFailures: string[] = []

        // Check required environment variables (matching GitHub reference)
        const requiredEnvVars = {
          AUTH_API_URL: envVars.AUTH_API_URL,
          COOKIE_NAME: envVars.COOKIE_NAME,
          DOMAIN: envVars.DOMAIN,
          INTL_API_URL: envVars.INTL_API_URL,
        }

        for (const [name, value] of Object.entries(requiredEnvVars)) {
          if (!value) {
            status = "DOWN"
            missing.push(name)
          }
        }

        // Database check (matching GitHub reference pattern)
        try {
          if (request.context?.db) {
            const roles = await request.context.db
              .selectFrom("roles")
              .selectAll()
              .execute()
            if (!(roles.length > 0)) {
              status = "DOWN"
              checkFailures.push("Database")
            }
          } else {
            status = "DOWN"
            checkFailures.push("Database")
          }
        } catch (_error) {
          status = "DOWN"
          checkFailures.push("Database")
        }

        // Combine all failure reasons
        let reason: string | undefined

        if (missing.length > 0) {
          reason = `Env variables missing: [${missing.join(", ")}]`
        }

        if (checkFailures.length > 0) {
          const checkFailureStr = `Check failures: [${checkFailures.join(", ")}]`
          reason = reason ? `${reason}, ${checkFailureStr}` : checkFailureStr
        }

        return reply.code(200).send({
          status,
          reason,
        })
      } catch (error) {
        let reason = "Service error"
        if (error instanceof Error) reason = error.message

        return reply.code(200).send({
          status: "DOWN",
          reason,
        })
      }
    }
  )
}
