import Fastify from "fastify"

async function testBasicFastify() {
  const fastify = Fastify({ logger: true })

  // Register a simple route without any middleware
  fastify.get("/test", (_request, reply) => {
    console.log("Route reached successfully")
    console.log("Reply type:", typeof reply)
    console.log("Reply methods:", Object.getOwnPropertyNames(reply))

    return reply.send({
      status: "ok",
      message: "Basic Fastify test",
    })
  })

  await fastify.ready()

  // Test the route
  const response = await fastify.inject({
    method: "GET",
    url: "/test",
  })

  console.log("Response status:", response.statusCode)
  console.log("Response body:", response.body)

  await fastify.close()
}

testBasicFastify().catch(console.error)
