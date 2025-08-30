import type { FastifyInstance, FastifyRequest } from "fastify"
import fp from "fastify-plugin"
import { type RedisClientType, createClient } from "redis"

declare module "fastify" {
  interface FastifyRequest {
    redis: RedisClientType
  }
}

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
        reconnectStrategy: (retries) => {
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
    redisClient.on("error", (error) => {
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
 * Setup Redis middleware with singleton client
 * Uses a shared Redis connection instead of creating per-request clients
 */
export async function setupRedisMiddleware(
  app: FastifyInstance,
  _basePath: string
) {
  await app.register(
    fp(async (fastify) => {
      fastify.decorateRequest("redis", null)

      fastify.addHook("onRequest", async (request, _reply) => {
        try {
          const redisUrl = process.env.REDIS_URL

          if (!redisUrl) {
            console.warn("REDIS_URL not configured")
            return
          }

          // Get the singleton Redis client
          const redis = await getRedisClient(redisUrl)

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
                console.warn(
                  "Error shutting down existing Redis client:",
                  error
                )
                // Continue with recreation even if shutdown fails
              } finally {
                redisClient = null
              }
            }

            // Create new healthy connection after old client is closed
            const healthyRedis = await getRedisClient(redisUrl)
            request.redis = healthyRedis
          } else {
            request.redis = redis
          }
        } catch (error) {
          console.error("Failed to setup Redis middleware:", error)
          // Continue without Redis - the application can handle missing Redis gracefully
        }
      })
    })
  )
}

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
