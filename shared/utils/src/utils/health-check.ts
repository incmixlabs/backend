import { OpenAPIHono } from "@hono/zod-openapi"
import { createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"
import type { Context, Env } from "hono"

/**
 * Schema for the health check response
 */
export const HealthCheckSchema = z
  .object({
    status: z.string().openapi({ example: "UP" }),
    reason: z.string().optional().openapi({ example: "Service unavailable" }),
  })
  .openapi("Healthcheck")

/**
 * Create a health check function for the /reference endpoint
 */
export function createReferenceEndpointCheck(basePath: string) {
  return async (): Promise<boolean> => {
    try {
      // Get the current server's URL
      const serverUrl =
        process.env.NODE_ENV === "production"
          ? `http://localhost:${process.env.PORT || 3000}`
          : `http://localhost:${process.env.PORT || 3000}`

      const referenceUrl = `${serverUrl}${basePath}/reference`

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 5000)
      })

      const response = await Promise.race([
        fetch(referenceUrl, { method: "GET" }),
        timeoutPromise,
      ])

      return response.ok
    } catch (error) {
      console.error(
        `Reference endpoint check failed for ${basePath}/reference:`,
        error
      )
      return false
    }
  }
}

/**
 * Type for the health check configuration
 */
export type HealthCheckConfig<T extends Env> = {
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
    check: (c: Context<T>) => Promise<boolean>
  }>

  /**
   * OpenAPI tags for documentation
   */
  tags?: string[]

  /**
   * Whether to require authentication for the health check endpoint
   */
  requireAuth?: boolean

  /**
   * Base path of the current service (for checking /reference endpoint)
   */
  basePath?: string
}

/**
 * Create a health check route
 */
export function createHealthCheckRoute<T extends Env>({
  envVars,
  checks = [],
  tags = ["Health Check"],
  requireAuth = false,
  basePath,
}: HealthCheckConfig<T>) {
  const security = requireAuth ? [{ cookieAuth: [] }] : undefined

  // Add reference endpoint check if basePath is provided
  const allChecks = [...checks]
  if (basePath) {
    allChecks.push({
      name: "Reference Endpoint",
      check: async () => {
        return await createReferenceEndpointCheck(basePath)()
      },
    })
  }

  // Create the OpenAPI route schema
  const healthCheckRoute = createRoute({
    path: "/",
    method: "get",
    security,
    tags,
    summary: "Check Service Health",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: HealthCheckSchema,
          },
        },
        description: "Returns Service Status",
      },
    },
  })

  // Create the Hono route handler
  const healthCheckRoutes = new OpenAPIHono<T>()

  healthCheckRoutes.openapi(healthCheckRoute, async (c) => {
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
            const isHealthy = await check(c)
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
      let reason: string | undefined = undefined

      if (missing.length > 0) {
        reason = `Env variables missing: [${missing.join(", ")}]`
      }

      if (checkFailures.length > 0) {
        const checkFailureStr = `Check failures: [${checkFailures.join(", ")}]`
        reason = reason ? `${reason}, ${checkFailureStr}` : checkFailureStr
      }

      return c.json(
        {
          status,
          reason,
        },
        200
      )
    } catch (error) {
      let reason = "Service error"
      if (error instanceof Error) reason = error.message

      return c.json(
        {
          status: "DOWN",
          reason,
        },
        200
      )
    }
  })

  return healthCheckRoutes
}
