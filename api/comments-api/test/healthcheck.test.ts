import { describe, expect, it, vi, beforeEach } from "vitest"
import { OpenAPIHono } from "@hono/zod-openapi"
import type { HonoApp } from "../src/types"

// Mock environment variables
vi.mock("../src/env-vars", () => ({
  envVars: {
    DATABASE_URL: "postgresql://test",
  },
}))

// Create mock initDb function
const mockInitDb = vi.fn()

// Mock the database module
vi.mock("@incmix-api/utils/db-schema", () => ({
  initDb: mockInitDb,
}))

// Mock the setupHealthCheck function
const mockSetupHealthCheck = vi.fn((app, config) => {
  // Simulate the healthcheck routes
  app.get("/healthcheck", (c) => {
    return c.json({
      status: "ok",
      service: config.serviceName,
      version: config.version,
      timestamp: new Date().toISOString(),
    })
  })

  app.get("/healthcheck/live", (c) => {
    return c.json({
      status: "ok",
      service: config.serviceName,
      version: config.version,
      timestamp: new Date().toISOString(),
    })
  })

  app.get("/healthcheck/ready", async (c) => {
    const checks: any = {}
    
    if (config.checks) {
      for (const [name, check] of Object.entries(config.checks)) {
        try {
          const result = await (check as any)()
          checks[name] = { status: result ? "healthy" : "unhealthy" }
        } catch {
          checks[name] = { status: "unhealthy" }
        }
      }
    }

    const hasUnhealthy = Object.values(checks).some((check: any) => check.status === "unhealthy")
    const status = hasUnhealthy ? "error" : "ok"
    
    return c.json({
      status,
      service: config.serviceName,
      version: config.version,
      checks,
      timestamp: new Date().toISOString(),
    }, hasUnhealthy ? 503 : 200)
  })
})

vi.mock("@incmix-api/utils", () => ({
  setupHealthCheck: mockSetupHealthCheck,
}))

describe("Healthcheck Routes", () => {
  let app: OpenAPIHono<HonoApp>
  let mockDb: any

  beforeEach(() => {
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

    // Create a new app instance for each test
    app = new OpenAPIHono<HonoApp>()
    
    // Call setupHealthCheck with the app
    mockSetupHealthCheck(app, {
      serviceName: "comments-api",
      version: "1.0.0",
      checks: {
        database: async () => {
          try {
            const db = mockInitDb("postgresql://test")
            if (!db) {
              return false
            }
            await db.selectFrom("comments").selectAll().limit(1).execute()
            return true
          } catch {
            return false
          }
        },
      },
    })
  })

  describe("GET /healthcheck", () => {
    it("should return 200 OK with basic health info", async () => {
      const response = await app.request("/healthcheck", {
        method: "GET",
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty("status", "ok")
      expect(data).toHaveProperty("service", "comments-api")
      expect(data).toHaveProperty("version", "1.0.0")
      expect(data).toHaveProperty("timestamp")
    })
  })

  describe("GET /healthcheck/live", () => {
    it("should return 200 OK for liveness check", async () => {
      const response = await app.request("/healthcheck/live", {
        method: "GET",
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty("status", "ok")
      expect(data).toHaveProperty("service", "comments-api")
      expect(data).toHaveProperty("version", "1.0.0")
      expect(data).toHaveProperty("timestamp")
    })

    it("should have correct content-type header", async () => {
      const response = await app.request("/healthcheck/live", {
        method: "GET",
      })

      expect(response.headers.get("content-type")).toContain("application/json")
    })
  })

  describe("GET /healthcheck/ready", () => {
    it("should return 200 OK when database is healthy", async () => {
      const response = await app.request("/healthcheck/ready", {
        method: "GET",
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty("status", "ok")
      expect(data).toHaveProperty("service", "comments-api")
      expect(data).toHaveProperty("version", "1.0.0")
      expect(data).toHaveProperty("checks")
      expect(data.checks).toHaveProperty("database")
      expect(data.checks.database).toHaveProperty("status", "healthy")
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

      const response = await app.request("/healthcheck/ready", {
        method: "GET",
      })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data).toHaveProperty("status", "error")
      expect(data.checks.database).toHaveProperty("status", "unhealthy")
    })

    it("should return 503 when database is null", async () => {
      mockInitDb.mockReturnValueOnce(null)

      const response = await app.request("/healthcheck/ready", {
        method: "GET",
      })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data).toHaveProperty("status", "error")
      expect(data.checks.database).toHaveProperty("status", "unhealthy")
    })
  })

  describe("Response format validation", () => {
    it("should include timestamp in ISO format", async () => {
      const response = await app.request("/healthcheck", {
        method: "GET",
      })

      const data = await response.json()
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      
      const date = new Date(data.timestamp)
      expect(date.toString()).not.toBe("Invalid Date")
    })

    it("should have proper checks structure in ready endpoint", async () => {
      const response = await app.request("/healthcheck/ready", {
        method: "GET",
      })

      const data = await response.json()
      expect(data.checks).toBeTypeOf("object")
      expect(data.checks.database).toBeTypeOf("object")
      expect(["healthy", "unhealthy"]).toContain(data.checks.database.status)
    })
  })

  describe("Error scenarios", () => {
    it("should handle database connection errors gracefully", async () => {
      mockInitDb.mockImplementationOnce(() => {
        throw new Error("Connection failed")
      })

      const response = await app.request("/healthcheck/ready", {
        method: "GET",
      })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe("error")
    })

    it("should handle unexpected errors in database query", async () => {
      mockDb.selectFrom.mockImplementationOnce(() => {
        throw new Error("Unexpected error")
      })

      const response = await app.request("/healthcheck/ready", {
        method: "GET",
      })

      expect(response.status).toBe(503)
      const data = await response.json()
      expect(data.status).toBe("error")
      expect(data.checks.database.status).toBe("unhealthy")
    })
  })
})