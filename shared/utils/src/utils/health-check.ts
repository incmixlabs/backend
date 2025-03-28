import { OpenAPIHono } from "@hono/zod-openapi"
import { createRoute } from "@hono/zod-openapi"
import { z } from "@hono/zod-openapi"

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
    check: () => Promise<boolean>
  }>
  
  /**
   * OpenAPI tags for documentation
   */
  tags?: string[]
  
  /**
   * Whether to require authentication for the health check endpoint
   */
  requireAuth?: boolean
}

/**
 * Create a health check route
 */
export function createHealthCheckRoute<T extends object = any>(config: HealthCheckConfig) {
  const tags = config.tags || ["Health Check"]
  const security = config.requireAuth ? [{ cookieAuth: [] }] : undefined

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
      if (config.envVars) {
        for (const [name, value] of Object.entries(config.envVars)) {
          if (!value) {
            status = "DOWN"
            missing.push(name)
          }
        }
      }

      // Run additional health checks
      if (config.checks) {
        for (const { name, check } of config.checks) {
          try {
            const isHealthy = await check()
            if (!isHealthy) {
              status = "DOWN"
              checkFailures.push(name)
            }
          } catch (error) {
            status = "DOWN"
            checkFailures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`)
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