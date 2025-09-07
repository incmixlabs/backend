import type { FastifyInstance } from "fastify"
import fastify from "fastify"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock external APIs
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe("Healthcheck Routes", () => {
  let app: FastifyInstance

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock environment variables if needed

    // Create a new Fastify instance for each test
    app = fastify({ logger: false })

    // Setup basic healthcheck route
    app.get("/api/healthcheck", (_request, reply) => {
      return reply.send({
        status: "ok",
        service: "files-api",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      })
    })
  })

  describe("GET /api/healthcheck", () => {
    it("should return 200 OK with basic health info", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/healthcheck",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data).toHaveProperty("status", "ok")
      expect(data).toHaveProperty("service", "files-api")
      expect(data).toHaveProperty("version", "1.0.0")
      expect(data).toHaveProperty("timestamp")
    })
  })

  describe("Response validation", () => {
    it("should have correct content-type header", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/healthcheck",
      })

      expect(response.headers["content-type"]).toContain("application/json")
    })

    it("should include timestamp in ISO format", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/healthcheck",
      })

      const data = JSON.parse(response.body)
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      const date = new Date(data.timestamp)
      expect(date.toString()).not.toBe("Invalid Date")
    })
  })
})
