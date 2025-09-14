import fastify from "fastify"
import { setupRedisFastifyPlugin } from "./redis"

const app = fastify({ logger: true })

// Register the Redis plugin
app.register(setupRedisFastifyPlugin)

// Example route using Redis
app.get("/cache/:key", async (request, reply) => {
  const { key } = request.params as { key: string }

  try {
    // Get value from Redis
    const value = await app.redis.get(key)

    if (value) {
      return { source: "cache", value }
    } else {
      return { source: "cache", value: null, message: "Key not found" }
    }
  } catch (error) {
    request.log.error({ err: error }, "Redis error")
    return reply.code(500).send({ error: "Redis operation failed" })
  }
})

// Example route to set a value in Redis
app.post("/cache/:key", async (request, reply) => {
  const { key } = request.params as { key: string }
  const { value, ttl = 3600 } = request.body as { value: string; ttl?: number }

  try {
    // Set value in Redis with TTL
    await app.redis.setEx(key, ttl, value)

    return { success: true, key, ttl }
  } catch (error) {
    request.log.error({ err: error }, "Redis error")
    return reply.code(500).send({ error: "Redis operation failed" })
  }
})

// Start the server
const start = async () => {
  try {
    await app.listen({ port: 3000 })
    console.log("Server listening on http://localhost:3000")
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
