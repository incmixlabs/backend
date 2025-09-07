import type { FastifyInstance, FastifyRequest } from "fastify"
import { z } from "zod"
import { envVars } from "../env-config"
/**
 * Schema for the health check response
 */
export const HealthCheckSchema = z.object({
  status: z.string(),
  reason: z.string().optional(),
})

/**
 * Create a health check function for the /reference endpoint
 */
export function createReferenceEndpointCheck(basePath: string) {
  const normalize = (p: string) =>
    p.startsWith("/") ? p.replace(/\/$/, "") : `/${p.replace(/\/$/, "")}`
  return async (request: FastifyRequest): Promise<boolean> => {
    const origin = new URL(
      request.url,
      `${request.protocol}://${request.hostname}`
    ).origin
    const referenceUrl = `${origin}${normalize(basePath)}/reference`
    const controller = new AbortController()
    const timer = setTimeout(
      () => controller.abort(),
      envVars.TIMEOUT_MS as number
    )
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

/**
 * Type for the health check configuration
 */
export type HealthCheckConfig = {
  /**
   * Environment variables to check
   * Key is the environment variable name, value is the actual value
   */
  envVars?: Record<string, string | undefined>

  /**
   * Additional health check functions that return true if healthy
   * Each function should return a promise that resolves to a boolean
   * If any check returns false, the health status will be DOWN
   */
  checks?: Array<{
    name: string
    check: (request: FastifyRequest) => Promise<boolean>
  }>

  /**
   * OpenAPI tags for documentation
   */
  tags?: string[]

  /**
   * Base path of the current service (for checking /reference endpoint)
   */
  basePath?: string
}

/**
 * Create a health check route plugin for Fastify
 */
export function createHealthCheckRoute({
  envVars,
  checks = [],
  tags = ["Health Check"],
  basePath,
}: HealthCheckConfig) {
  // biome-ignore lint/suspicious/useAwait: async is needed for nested async route handler
  return async (fastify: FastifyInstance) => {
    // Add reference endpoint check if basePath is provided
    const allChecks = [...checks]
    if (basePath) {
      allChecks.push({
        name: "Reference Endpoint",
        check: createReferenceEndpointCheck(basePath),
      })
    }

    const schema = {
      tags,
      summary: "Check Service Health",
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string", example: "UP" },
            reason: { type: "string", example: "Service unavailable" },
          },
        },
      },
    }

    fastify.get("/", { schema }, async (request, reply) => {
      try {
        let status = "UP"
        const missing: string[] = []
        const checkFailures: string[] = []

        // Check environment variables
        if (envVars) {
          for (const [name, value] of Object.entries(envVars)) {
            if (!value) {
              status = "DOWN"
              missing.push(name)
            }
          }
        }

        // Run additional health checks
        if (allChecks.length > 0) {
          for (const { name, check } of allChecks) {
            try {
              const isHealthy = await check(request)
              if (!isHealthy) {
                status = "DOWN"
                checkFailures.push(name)
              }
            } catch (error) {
              status = "DOWN"
              checkFailures.push(
                `${name}: ${error instanceof Error ? error.message : String(error)}`
              )
            }
          }
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

        return reply.send({
          status,
          reason,
        })
      } catch (error) {
        let reason = "Service error"
        if (error instanceof Error) reason = error.message

        return reply.send({
          status: "DOWN",
          reason,
        })
      }
    })
  }
}
