import type { OpenAPIHono } from "@hono/zod-openapi"
import { createRoute, z } from "@hono/zod-openapi"

export interface SimpleHealthCheckConfig {
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
  checks: z.record(z.boolean()).optional(),
})

export function setupSimpleHealthCheck<T extends OpenAPIHono<any, any, any>>(
  app: T,
  config: SimpleHealthCheckConfig
) {
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
    const response = {
      status: "healthy" as "healthy" | "unhealthy",
      service: config.serviceName,
      version: config.version,
      timestamp: Date.now(),
      checks: {} as Record<string, boolean>,
    }

    // Run all health checks if provided
    if (config.checks) {
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
        response.checks[name as string] = result as boolean
        if (!result) {
          response.status = "unhealthy"
        }
      }
    }

    const statusCode = response.status === "healthy" ? 200 : 503
    return c.json(response, statusCode)
  })

  return app
}
