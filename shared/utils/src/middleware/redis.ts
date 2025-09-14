// TODO: Refactor REDIS as a common service
// Currently Redis is implemented separately for Hono (here) and Fastify (location-api/plugins/redis.ts)
// Consider creating a shared Redis service in shared/utils that can be used by both frameworks

import rateLimit from "@fastify/rate-limit"
import type { OpenAPIHono } from "@hono/zod-openapi"
import type { FastifyInstance, FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import type { Env as HonoEnv } from "hono"
import { createClient, type RedisClientType } from "redis"
import { envVars } from "../env-config"

declare module "hono" {
  interface ContextVariableMap {
    redis: RedisClientType
  }
}

declare module "fastify" {
  interface FastifyInstance {
    redis: RedisClientType
  }
}

type Env = {
  Bindings: { REDIS_URL: string }
} & HonoEnv

// Singleton Redis client instance
let redisClient: RedisClientType | null = null
let isConnecting = false
let connectionPromise: Promise<void> | null = null

/**
 * Get or create the singleton Redis client
 * Ensures only one connection is established and reused
 */
async function getRedisClient(redisUrl: string): Promise<RedisClientType> {
  // If client exists and is connected, return it
  if (redisClient?.isOpen) {
    return redisClient
  }

  // If client exists but is not connected, try to reconnect
  if (redisClient && !redisClient.isOpen) {
    try {
      await redisClient.connect()
      return redisClient
    } catch (error) {
      console.warn(
        "Failed to reconnect existing Redis client, creating new one:",
        error
      )
      // Fall through to create new client
    }
  }

  // If connection is in progress, wait for it
  if (isConnecting && connectionPromise) {
    await connectionPromise
    if (redisClient?.isOpen) {
      return redisClient
    }
  }

  // Create new client and connection
  isConnecting = true
  connectionPromise = createRedisConnection(redisUrl)

  try {
    await connectionPromise
    if (!redisClient) {
      throw new Error("Failed to create Redis client")
    }
    return redisClient
  } finally {
    isConnecting = false
    connectionPromise = null
  }
}

/**
 * Create a new Redis connection
 */
async function createRedisConnection(redisUrl: string): Promise<void> {
  try {
    // Clean up existing client if it exists
    if (redisClient) {
      try {
        await redisClient.quit()
      } catch (error) {
        console.warn("Error quitting existing Redis client:", error)
      }
    }

    // Create new client
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries = 3) => {
          if (retries > 10) {
            console.error("Redis max reconnection attempts reached")
            return new Error("Redis max reconnection attempts reached")
          }
          return Math.min(retries * 100, 3000)
        },
        connectTimeout: 10000,
      },
    })

    // Set up error handling
    redisClient.on("error", (error: unknown) => {
      console.error("Redis client error:", error)
    })

    redisClient.on("connect", () => {
      console.log("Redis client connected")
    })

    redisClient.on("ready", () => {
      console.log("Redis client ready")
    })

    redisClient.on("end", () => {
      console.log("Redis client connection ended")
    })

    // Connect to Redis
    await redisClient.connect()
  } catch (error) {
    console.error("Failed to create Redis connection:", error)
    redisClient = null
    throw error
  }
}

/**
 * Health check for Redis client
 */
async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false
    }

    // Simple ping to check if Redis is responsive
    await redisClient.ping()
    return true
  } catch (error) {
    console.error("Redis health check failed:", error)
    return false
  }
}

/**
 * Setup Redis middleware for Hono with singleton client
 * Uses a shared Redis connection instead of creating per-request clients
 */
export function setupRedisMiddleware<T extends Env>(
  app: OpenAPIHono<T>,
  basePath: string
) {
  app.use(`${basePath}/*`, async (c, next) => {
    try {
      const redisUrl = envVars.REDIS_URL

      // Get the singleton Redis client
      const redis = await getRedisClient(redisUrl as string)

      // Verify client health before proceeding
      if (!(await checkRedisHealth())) {
        console.warn(
          "Redis client unhealthy, attempting to recreate connection"
        )
        // Gracefully shutdown existing client before recreating
        if (redisClient) {
          try {
            await redisClient.quit()
            console.log("Existing Redis client shutdown successfully")
          } catch (error) {
            console.warn("Error shutting down existing Redis client:", error)
            // Continue with recreation even if shutdown fails
          } finally {
            redisClient = null
          }
        }

        // Create new healthy connection after old client is closed
        const healthyRedis = await getRedisClient(redisUrl as string)
        c.set("redis", healthyRedis)
      } else {
        c.set("redis", redis)
      }

      return next()
    } catch (error) {
      console.error("Failed to setup Redis middleware:", error)
      // Continue without Redis - the application can handle missing Redis gracefully
      return next()
    }
  })
}

/**
 * Fastify Redis plugin with singleton client
 * Uses a shared Redis connection instead of creating per-request clients
 */
const redisPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  try {
    // Register rate limiting plugin
    await fastify.register(rateLimit, {
      // Restrict to e.g. 5 requests per minute from each IP to the endpoints using default global (can be overridden per route)
      max: 5,
      timeWindow: "1 minute",
    })
    const redisUrl = envVars.REDIS_URL

    if (!redisUrl) {
      fastify.log.warn("REDIS_URL not configured, skipping Redis setup")
      return
    }

    // Get the singleton Redis client
    const redis = await getRedisClient(redisUrl)

    // Verify client health
    if (!(await checkRedisHealth())) {
      fastify.log.warn(
        "Redis client unhealthy, attempting to recreate connection"
      )
      // Gracefully shutdown existing client before recreating
      if (redisClient) {
        try {
          await redisClient.quit()
          fastify.log.info("Existing Redis client shutdown successfully")
        } catch (error) {
          fastify.log.warn(
            { err: error },
            "Error shutting down existing Redis client"
          )
        } finally {
          redisClient = null
        }
      }

      // Create new healthy connection after old client is closed
      const healthyRedis = await getRedisClient(redisUrl)
      fastify.decorate("redis", healthyRedis)
    } else {
      fastify.decorate("redis", redis)
    }

    // Add health check route
    fastify.get(
      "/health/redis",
      { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
      async (_request, reply) => {
        const status = getRedisStatus()
        const isHealthy = await checkRedisHealth()

        if (isHealthy) {
          return reply.code(200).send({
            status: "healthy",
            ...status,
          })
        } else {
          return reply.code(503).send({
            status: "unhealthy",
            ...status,
          })
        }
      }
    )

    // CodeQL [js/missing-rate-limiting] - TODO: This is a lifecycle hook for graceful shutdown, not a route handler
    // Rate limiting is not applicable here. Will review cleanup pattern in future iteration.
    fastify.addHook("onClose", async () => {
      await shutdownRedis()
    })

    fastify.log.info("Redis plugin initialized successfully")
  } catch (error) {
    fastify.log.error({ err: error }, "Failed to setup Redis plugin")
    // Continue without Redis - the application can handle missing Redis gracefully
  }
}

/**
 * Export the Fastify plugin wrapped with fastify-plugin
 */
export const setupRedisFastifyPlugin = fp(redisPlugin, {
  name: "redis-middleware",
  fastify: "5.x",
})

/**
 * Gracefully shutdown Redis client
 * Call this when shutting down the application
 */
export async function shutdownRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit()
      console.log("Redis client shutdown successfully")
    } catch (error) {
      console.error("Error shutting down Redis client:", error)
    } finally {
      redisClient = null
    }
  }
}

/**
 * Get Redis client status for monitoring
 */
export function getRedisStatus(): {
  isConnected: boolean
  isConnecting: boolean
  hasClient: boolean
} {
  return {
    isConnected: redisClient?.isOpen ?? false,
    isConnecting,
    hasClient: redisClient !== null,
  }
}
