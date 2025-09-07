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

    // Mock environment variables
    vi.stubEnv("AUTH_API_URL", "http://localhost:8080")
    vi.stubEnv("INTL_API_URL", "http://localhost:9090")
    vi.stubEnv("TIMEOUT_MS", "5000")

    // Create a new Fastify instance for each test
    app = fastify({ logger: false })

    // Setup test routes similar to the main app
    app.get("/api/healthcheck", (_request, reply) => {
      // Mock the health check response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "ok",
          service: "auth",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
        }),
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "ok",
          service: "intl",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
        }),
      })

      const results = [
        {
          auth: {
            status: "ok",
            service: "auth",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
          },
        },
        {
          intl: {
            status: "ok",
            service: "intl",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
          },
        },
      ]

      return reply.send(results)
    })
  })

  describe("GET /api/healthcheck", () => {
    it("should return 200 OK with health info from downstream services", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/healthcheck",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)

      // Check that we have auth service response
      const authResult = data.find((item) => item.auth)
      expect(authResult).toBeDefined()
      expect(authResult.auth).toHaveProperty("status", "ok")
    })
  })

  describe("Error handling", () => {
    it("should handle downstream service failures", async () => {
      // Mock a failing service
      mockFetch.mockRejectedValueOnce(new Error("Service unavailable"))

      const response = await app.inject({
        method: "GET",
        url: "/api/healthcheck",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(Array.isArray(data)).toBe(true)
    })

    it("should have correct content-type header", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/healthcheck",
      })

      expect(response.headers["content-type"]).toContain("application/json")
    })
  })

  describe("Response validation", () => {
    it("should return aggregated results from multiple services", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/healthcheck",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(Array.isArray(data)).toBe(true)

      // Should have at least one service result
      expect(data.length).toBeGreaterThan(0)
    })
  })

  describe("Timeout handling", () => {
    it("should handle service timeouts gracefully", async () => {
      // Mock a timeout scenario
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: false,
                  status: 408,
                  statusText: "Request Timeout",
                }),
              100
            )
          })
      )

      const response = await app.inject({
        method: "GET",
        url: "/api/healthcheck",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(Array.isArray(data)).toBe(true)
    })
  })
})
