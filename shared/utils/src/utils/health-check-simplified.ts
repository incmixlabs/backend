import { createValidator } from "../ajv-schema"

export interface SimplifiedHealthCheckConfig {
  serviceName: string
  version?: string
  checks?: {
    database?: () => Promise<boolean>
    redis?: () => Promise<boolean>
    [key: string]: (() => Promise<boolean>) | undefined
  }
}

interface HealthCheckResponse {
  status: "healthy" | "unhealthy"
  service: string
  version?: string
  timestamp: number
  checks?: Record<string, boolean>
}

const healthCheckSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["healthy", "unhealthy"] },
    service: { type: "string" },
    version: { type: "string" },
    timestamp: { type: "number" },
    checks: {
      type: "object",
      additionalProperties: { type: "boolean" },
    },
  },
  required: ["status", "service", "timestamp"],
  additionalProperties: false,
}

const healthCheckValidator = createValidator(healthCheckSchema)

export function setupHealthCheck<T extends Hono<any, any, any>>(
  app: T,
  config: SimplifiedHealthCheckConfig
): T {
  app.get("/", async (c) => {
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
