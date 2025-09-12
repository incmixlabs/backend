import type { FastifyInstance } from "fastify"
import { envVars } from "@/env-vars"
import { setupHealthcheckRoutes } from "@/routes/health-check"
import orgRoutes from "./orgs"
import { setupPermissionRoutes } from "./permissions"

export const setupRoutes = async (app: FastifyInstance) => {
  // Add a direct test route to verify routing works at all
  if (envVars.NODE_ENV === "test") {
    app.get("/api/org/test-direct", async (_request, _reply) => {
      return { message: "Direct route works!" }
    })
  }
  // Register all routes with the base path prefix
  await app.register(
    async (fastify) => {
      // Add a simple test route to verify routing works
      if (envVars.NODE_ENV === "test") {
        fastify.get("/test", async (_request, _reply) => {
          return { message: "Test route works!" }
        })
      }

      await setupHealthcheckRoutes(fastify)
      await fastify.register(setupPermissionRoutes, { prefix: "/permissions" })
      // Register Hono-based org routes
      fastify.register(async (fastify) => {
        // Create Hono-to-Fastify bridge
        fastify.all("/orgs/*", {}, async (request, reply) => {
          // Create a proper Hono context from Fastify request
          const url = new URL(
            request.url,
            `http://${request.hostname || "localhost"}`
          )

          const body =
            request.method !== "GET" &&
            request.method !== "HEAD" &&
            request.body
              ? JSON.stringify(request.body)
              : undefined

          const honoRequest = new Request(url.toString(), {
            method: request.method,
            headers: request.headers as HeadersInit,
            body,
          })

          try {
            const response = await orgRoutes.request(honoRequest)
            const responseText = await response.text()

            // Set status
            reply.status(response.status)

            // Copy headers
            for (const [key, value] of response.headers.entries()) {
              reply.header(key, value)
            }

            // Parse JSON response if applicable
            const contentType = response.headers.get("content-type")
            if (contentType?.includes("application/json")) {
              try {
                return reply.send(JSON.parse(responseText))
              } catch {
                return reply.send(responseText)
              }
            } else {
              return reply.send(responseText)
            }
          } catch (error) {
            request.log.error(error, "Error handling Hono route")
            return reply.status(500).send({ error: "Internal server error" })
          }
        })
      })
    },
    { prefix: "/api/org" }
  )
}
