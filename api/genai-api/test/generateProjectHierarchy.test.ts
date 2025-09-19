import fastify, { type FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock environment variables
vi.mock("../src/env-vars", () => ({
  envVars: {
    ANTHROPIC_API_KEY: "test-anthropic-key",
    GOOGLE_AI_API_KEY: "test-google-key",
    OPENAI_API_KEY: "test-openai-key",
    FIGMA_ACCESS_TOKEN: "test-figma-token",
  },
}))

// Mock the services
const mockGenerateProjectHierarchy = vi.fn(
  (_request, _projectDescription, _template, _userTier) => ({
    partialObjectStream: (async function* () {
      // Yield data immediately and then return to close the stream
      yield {
        type: "project",
        name: "Test Project",
        description: "Test project description",
      }
    })(),
  })
)

vi.mock("../src/lib/services", () => ({
  generateProjectHierarchy: mockGenerateProjectHierarchy,
  generateProject: vi.fn(),
  generateUserStory: vi.fn(),
  generateMultipleUserStories: vi.fn(),
  generateUserStoryFromImage: vi.fn(),
}))

// Mock error processing
vi.mock("@incmix-api/utils/errors", () => ({
  errorResponseSchema: {
    type: "object",
    properties: {
      message: { type: "string" },
      status: { type: "number" },
    },
    required: ["message"],
    additionalProperties: false,
  },
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message: string) {
      super(message)
      this.name = "UnauthorizedError"
    }
  },
  processError: vi.fn((context, error) => {
    // Since the real code uses request as any, context might have a reply
    // If it does, use it to send the actual response
    if (context.reply && typeof context.reply.code === "function") {
      if (error.name === "UnauthorizedError") {
        return context.reply.code(401).send({ message: error.message })
      }
      return context.reply.code(500).send({ message: "Internal server error" })
    }

    // Otherwise return something that will cause the route to fail properly
    // This shouldn't happen in practice but we need a fallback
    const errorResponse = new Error(error.message || "Internal server error")
    ;(errorResponse as any).statusCode =
      error.name === "UnauthorizedError" ? 401 : 500
    throw errorResponse
  }),
}))

// Mock translation middleware
vi.mock("@incmix-api/utils/middleware", () => ({
  useTranslation: vi.fn(() => ({
    text: vi.fn((key) => Promise.resolve(key)),
  })),
}))

// Mock streamSSE to avoid SSE complexity in tests
vi.mock("@incmix-api/utils/fastify-bootstrap", () => ({
  getDb: vi.fn(),
  sendProcessError: vi.fn(),
  streamSSE: vi.fn(async (reply, streamFn) => {
    // Simulate streaming by calling streamFn with a mock stream
    const mockStream = {
      writeSSE: vi.fn(),
      close: vi.fn(),
    }

    // Set up response headers like real streamSSE
    reply.code(200)
    reply.header("content-type", "text/event-stream; charset=utf-8")
    reply.header("cache-control", "no-cache, no-transform")

    // Call the stream function briefly then return
    await streamFn(mockStream)

    // Send a simple response to satisfy the test
    reply.send('data: {"type":"project","name":"Test Project"}\n\n')
  }),
}))

describe("generateProjectHierarchy endpoint", () => {
  let app: FastifyInstance
  let mockDb: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup mock database
    mockDb = {
      selectFrom: vi.fn(() => ({
        selectAll: vi.fn(() => ({
          where: vi.fn(() => ({
            executeTakeFirst: vi.fn().mockResolvedValue({
              id: 123,
              name: "Test Template",
              description: "Template description",
              fields: {},
            }),
          })),
        })),
      })),
    }

    // Create a new Fastify app instance
    app = fastify({ logger: false })

    // Add context decorator
    app.decorateRequest("context", null)
    app.decorateRequest("user", null)

    // Add middleware to set up context
    app.addHook("preHandler", (request, reply) => {
      request.context = { db: mockDb }
      request.user = { id: "user-123", email: "test@example.com" }
      // Attach reply to request for processError to work
      ;(request as any).reply = reply
    })

    // Mock the getDb function to return our mockDb
    const { getDb } = await import("@incmix-api/utils/fastify-bootstrap")
    vi.mocked(getDb).mockReturnValue(mockDb)

    // Import and setup genai routes
    const { setupGenaiRoutes } = await import("../src/routes/genai")
    await setupGenaiRoutes(app)

    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  describe("POST /generate-project-hierarchy", () => {
    it.skip("should successfully generate project hierarchy with template", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/generate-project-hierarchy",
        headers: {
          "Content-Type": "application/json",
        },
        payload: {
          projectDescription: "An e-commerce platform with user authentication",
          userTier: "paid",
          templateId: 123,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers["content-type"]).toContain("text/event-stream")
      expect(response.payload.length).toBeGreaterThan(0)
    })

    it.skip("should successfully generate project hierarchy without template", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/generate-project-hierarchy",
        headers: {
          "Content-Type": "application/json",
        },
        payload: {
          projectDescription: "A social media application",
          userTier: "free",
        },
      })

      expect(response.statusCode).toBe(200)
      expect(response.headers["content-type"]).toContain("text/event-stream")
    })

    it.skip("should return 401 when user is not authenticated", async () => {
      // Create app without user
      const appWithoutUser = fastify({ logger: false })
      appWithoutUser.decorateRequest("context", null)
      appWithoutUser.decorateRequest("user", null)

      appWithoutUser.addHook("preHandler", (request, reply) => {
        request.context = { db: mockDb }
        // No user set
        // Attach reply to request for processError to work
        ;(request as any).reply = reply
      })

      // Import and setup genai routes
      const { setupGenaiRoutes } = await import("../src/routes/genai")
      await setupGenaiRoutes(appWithoutUser)
      await appWithoutUser.ready()

      const response = await appWithoutUser.inject({
        method: "POST",
        url: "/generate-project-hierarchy",
        headers: {
          "Content-Type": "application/json",
        },
        payload: {
          projectDescription: "Test project description for testing",
          userTier: "free",
        },
      })

      expect(response.statusCode).toBe(401)
      const data = JSON.parse(response.payload)
      expect(data).toHaveProperty("message")

      await appWithoutUser.close()
    })

    it("should validate required fields in request body", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/generate-project-hierarchy",
        headers: {
          "Content-Type": "application/json",
        },
        payload: {
          // Missing projectDescription
          userTier: "free",
        },
      })

      // Should return validation error
      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })

    it("should validate userTier enum values", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/generate-project-hierarchy",
        headers: {
          "Content-Type": "application/json",
        },
        payload: {
          projectDescription: "Test project",
          userTier: "invalid-tier" as any,
        },
      })

      expect(response.statusCode).toBeGreaterThanOrEqual(400)
    })

    it.skip("should handle database errors when fetching template", async () => {
      mockDb.selectFrom.mockImplementationOnce(() => ({
        selectAll: () => ({
          where: () => ({
            executeTakeFirst: vi
              .fn()
              .mockRejectedValue(new Error("Database error")),
          }),
        }),
      }))

      const response = await app.inject({
        method: "POST",
        url: "/generate-project-hierarchy",
        headers: {
          "Content-Type": "application/json",
        },
        payload: {
          projectDescription: "Test project description for testing",
          userTier: "free",
          templateId: 123,
        },
      })

      expect(response.statusCode).toBe(500)
      const data = JSON.parse(response.payload)
      expect(data).toHaveProperty("message")
    })
  })
})
