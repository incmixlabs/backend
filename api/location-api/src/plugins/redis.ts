import fp from "fastify-plugin"
import { createClient } from "redis"
import { envVars } from "../env-vars"

declare module "fastify" {
  interface FastifyInstance {
    redis: {
      get: (key: string) => Promise<string | null>
      setEx: (key: string, seconds: number, value: string) => Promise<void>
    }
  }
}

async function redisPlugin(fastify: any) {
  let client: import("redis").RedisClientType | null = null

  if (envVars.REDIS_URL) {
    try {
      client = createClient({ url: envVars.REDIS_URL })
      await client.connect()

      fastify.log.info("Connected to Redis")
    } catch (error) {
      fastify.log.warn("Failed to connect to Redis:", error)
    }
  }

  const redis = {
    async get(key: string): Promise<string | null> {
      if (!client?.isOpen) return null
      try {
        return await client.get(key)
      } catch (error) {
        fastify.log.warn("Redis GET error:", error)
        return null
      }
    },

    async setEx(key: string, seconds: number, value: string): Promise<void> {
      if (!client?.isOpen) return
      try {
        await client.setEx(key, seconds, value)
      } catch (error) {
        fastify.log.warn("Redis SETEX error:", error)
      }
    },
  }

  fastify.decorate("redis", redis)

  fastify.addHook("onClose", async () => {
    if (client?.isOpen) {
      await client.quit()
      fastify.log.info("Disconnected from Redis")
    }
  })
}

export default fp(redisPlugin, {
  name: "redis",
})
