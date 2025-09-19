import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// IMPORTANT: All mocks MUST be defined before any imports that might use them
// Mock the env-config module first to prevent hanging
vi.mock("@incmix-api/utils/env-config", () => ({
  createEnvConfig: vi.fn(() => ({
    DATABASE_URL: "postgresql://test",
    AUTH_API_URL: "http://localhost:3000",
    COOKIE_NAME: "test-cookie",
    DOMAIN: "test.com",
    INTL_API_URL: "http://localhost:3001",
    NODE_ENV: "test",
  })),
  Services: {},
}))

// Mock environment variables
vi.mock("../src/env-vars", () => ({
  envVars: {
    DATABASE_URL: "postgresql://test",
    AUTH_API_URL: "http://localhost:3000",
    COOKIE_NAME: "test-cookie",
    DOMAIN: "test.com",
    INTL_API_URL: "http://localhost:3001",
    NODE_ENV: "test",
  },
}))

// Now import modules that depend on the mocks
import fastify, { type FastifyInstance } from "fastify"

// Create mock initDb function
const mockInitDb = vi.fn()

// Mock the database module
vi.mock("@incmix-api/utils/db-schema", () => ({
  initDb: mockInitDb,
}))

describe.skip("Healthcheck Routes", () => {
  let app: FastifyInstance
  let mockDb: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup mock database
    mockDb = {
      selectFrom: vi.fn(() => ({
        selectAll: vi.fn(() => ({
          limit: vi.fn(() => ({
            execute: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
    }

    mockInitDb.mockReturnValue(mockDb)

    // Create a new Fastify app instance for each test
    app = fastify({ logger: false })

    // Add context decorator
    app.decorateRequest("context", null)

    // Add middleware to set up context
    app.addHook("preHandler", (request) => {
      request.context = { db: mockDb }
    })

    // Import and setup healthcheck routes
    const { setupHealthcheckRoutes } = await import("../src/routes/healthcheck")
    await setupHealthcheckRoutes(app)

    await app.ready()
  })

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  describe("GET /healthcheck", () => {
    it("should return 200 OK with health info", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/healthcheck",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      expect(data).toHaveProperty("status")
      expect(data).toHaveProperty("service", "genai-api")
      expect(data).toHaveProperty("timestamp")
      expect(data).toHaveProperty("checks")
    })

    it("should return 200 when database is healthy", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/healthcheck",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.payload)
      expect(data.status).toBe("UP")
      expect(data.checks.database).toBe(true)
    })

    it("should return 503 when database check fails", async () => {
      // Make the database check fail
      mockDb.selectFrom.mockImplementationOnce(() => ({
        selectAll: () => ({
          limit: () => ({
            execute: vi.fn().mockRejectedValueOnce(new Error("Database error")),
          }),
        }),
      }))

      const response = await app.inject({
        method: "GET",
        url: "/healthcheck",
      })

      expect(response.statusCode).toBe(503)
      const data = JSON.parse(response.payload)
      expect(data.status).toBe("DOWN")
      expect(data.checks.database).toBe(false)
    })

    it("should have correct content-type header", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/healthcheck",
      })

      expect(response.headers["content-type"]).toContain("application/json")
    })
  })

  describe("Response format validation", () => {
    it("should include timestamp in ISO format", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/healthcheck",
      })

      const data = JSON.parse(response.payload)
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      const date = new Date(data.timestamp)
      expect(date.toString()).not.toBe("Invalid Date")
    })

    it("should have proper checks structure", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/healthcheck",
      })

      const data = JSON.parse(response.payload)
      expect(data.checks).toBeTypeOf("object")
      expect(typeof data.checks.database).toBe("boolean")
      expect(typeof data.checks.envVars).toBe("boolean")
    })
  })

  describe("Error scenarios", () => {
    it("should handle database connection errors gracefully", async () => {
      // Create a new app instance for this test to avoid hook conflicts
      const testApp = fastify({ logger: false })
      testApp.decorateRequest("context", null)

      // Mock database to be unavailable
      testApp.addHook("preHandler", (request) => {
        request.context = { db: null }
      })

      const { setupHealthcheckRoutes } = await import(
        "../src/routes/healthcheck"
      )
      await setupHealthcheckRoutes(testApp)
      await testApp.ready()

      const response = await testApp.inject({
        method: "GET",
        url: "/healthcheck",
      })

      expect(response.statusCode).toBe(503)
      const data = JSON.parse(response.payload)
      expect(data.status).toBe("DOWN")

      await testApp.close()
    })

    it("should handle unexpected errors in database query", async () => {
      mockDb.selectFrom.mockImplementationOnce(() => {
        throw new Error("Unexpected error")
      })

      const response = await app.inject({
        method: "GET",
        url: "/healthcheck",
      })

      expect(response.statusCode).toBe(503)
      const data = JSON.parse(response.payload)
      expect(data.status).toBe("DOWN")
      expect(data.checks.database).toBe(false)
    })
  })
})
