import type { OpenAPIHono } from "@hono/zod-openapi"
import { createRoute, z } from "@hono/zod-openapi"

export interface SimplifiedHealthCheckConfig {
  serviceName: string
  version?: string
  checks?: {
    database?: () => Promise<boolean>
    redis?: () => Promise<boolean>
    [key: string]: (() => Promise<boolean>) | undefined
  }
}

const healthCheckSchema = z.object({
  status: z.enum(["healthy", "unhealthy"]),
  service: z.string(),
  version: z.string().optional(),
  timestamp: z.number(),
  checks: z.record(z.string(), z.boolean()).optional(),
})

export function setupHealthCheck<T extends OpenAPIHono<any, any, any>>(
  app: T,
  config: SimplifiedHealthCheckConfig
): T {
  const route = createRoute({
    method: "get",
    path: "/health",
    tags: ["Health"],
    summary: `${config.serviceName} health check`,
    description: `Check the health status of the ${config.serviceName} service`,
    responses: {
      200: {
        description: "Service is healthy",
        content: {
          "application/json": {
            schema: healthCheckSchema,
          },
        },
      },
      503: {
        description: "Service is unhealthy",
        content: {
          "application/json": {
            schema: healthCheckSchema,
          },
        },
      },
    },
  })

  app.openapi(route, async (c) => {
    const response: {
      status: "healthy" | "unhealthy"
      service: string
      version?: string
      timestamp: number
      checks?: Record<string, boolean>
    } = {
      status: "healthy",
      service: config.serviceName,
      version: config.version,
      timestamp: Date.now(),
    }

    // Run all health checks if provided
    if (config.checks) {
      const checks: Record<string, boolean> = {}
      const checkPromises = Object.entries(config.checks).map(
        async ([name, check]) => {
          if (check) {
            try {
              const result = await check()
              return [name, result]
            } catch (error) {
              console.error(`Health check failed for ${name}:`, error)
              return [name, false]
            }
          }
          return [name, true]
        }
      )

      const checkResults = await Promise.all(checkPromises)

      for (const [name, result] of checkResults) {
        checks[name as string] = result as boolean
        if (!result) {
          response.status = "unhealthy"
        }
      }

      response.checks = checks
    }

    const statusCode = response.status === "healthy" ? 200 : 503
    return c.json(response, statusCode)
  })

  return app
}
