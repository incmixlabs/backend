import fastifyCookie from "@fastify/cookie"
import fastifyHelmet from "@fastify/helmet"
import fastifySensible from "@fastify/sensible"
import Fastify from "fastify"

const fastify = Fastify({ logger: true })

// Register the same middleware stack as in the actual app
async function debugMiddleware() {
  try {
    // Test basic Fastify reply methods
    console.log("Testing basic Fastify setup...")

    await fastify.register(fastifyCookie)
    await fastify.register(fastifyHelmet)
    await fastify.register(fastifySensible)

    // Add a test route to see what methods are available
    fastify.get("/debug", (_request, reply) => {
      console.log("reply methods:", Object.getOwnPropertyNames(reply))
      console.log("reply.send type:", typeof reply.send)
      console.log("reply.json exists:", "json" in reply)
      console.log("reply.status exists:", "status" in reply)
      console.log("reply.code exists:", "code" in reply)

      return reply.send({ message: "debug ok" })
    })

    // Start server
    await fastify.listen({ port: 3001, host: "localhost" })

    // Make test request
    const response = await fetch("http://localhost:3001/debug")
    const body = await response.json()

    console.log("Response status:", response.status)
    console.log("Response body:", body)

    await fastify.close()
  } catch (error) {
    console.error("Error:", error)
    await fastify.close()
  }
}

debugMiddleware()
