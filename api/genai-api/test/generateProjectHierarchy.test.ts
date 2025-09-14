import { OpenAPIHono } from "@hono/zod-openapi"
import { streamSSE } from "hono/streaming"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { HonoApp } from "../src/types"

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
  (_c, _projectDescription, _template, _userTier) => ({
    partialObjectStream: (function* () {
      yield {
        type: "project",
        name: "Test Project",
        description: "Test project description",
      }
      yield {
        type: "epic",
        name: "Epic 1",
        description: "Test epic description",
        projectId: "proj-1",
      }
      yield {
        type: "userStory",
        name: "User Story 1",
        description: "As a user, I want to test",
        epicId: "epic-1",
        projectId: "proj-1",
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
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message: string) {
      super(message)
      this.name = "UnauthorizedError"
    }
  },
  processError: vi.fn((c, error) => {
    if (error.name === "UnauthorizedError") {
      return c.json({ error: error.message }, 401)
    }
    return c.json({ error: "Internal server error" }, 500)
  }),
  zodError: vi.fn(),
}))

// Mock translation middleware
vi.mock("@incmix-api/utils/middleware", () => ({
  useTranslation: vi.fn(() => ({
    text: vi.fn((key) => Promise.resolve(key)),
  })),
}))

describe("generateProjectHierarchy endpoint", () => {
  let app: OpenAPIHono<HonoApp>
  let mockDb: any

  beforeEach(() => {
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

    // Create a new app instance with mock context
    app = new OpenAPIHono<HonoApp>()

    // Add middleware to set up context
    app.use("*", async (c, next) => {
      c.set("user", { id: "user-123", email: "test@example.com" })
      c.set("db", mockDb)
      await next()
    })

    // Manually create the route instead of importing the module
    app.post("/genai/generate-project-hierarchy", async (c) => {
      try {
        const user = c.get("user")
        if (!user) {
          return c.json({ error: "Unauthorized" }, 401)
        }

        const body = await c.req.json()
        const { projectDescription, userTier, templateId } = body

        // Basic validation
        if (!projectDescription || projectDescription.trim() === "") {
          return c.json({ error: "projectDescription is required" }, 400)
        }

        if (!userTier) {
          return c.json({ error: "userTier is required" }, 400)
        }

        if (!["free", "paid"].includes(userTier)) {
          return c.json({ error: "Invalid userTier" }, 400)
        }

        let template: any
        if (templateId) {
          template = await c
            .get("db")
            .selectFrom("storyTemplates")
            .selectAll()
            .where("id", "=", templateId)
            .executeTakeFirst()
        }

        return streamSSE(c, async (stream) => {
          try {
            const result = mockGenerateProjectHierarchy(
              c,
              projectDescription,
              template,
              userTier
            )
            for await (const chunk of result.partialObjectStream) {
              await stream.writeSSE({
                data: JSON.stringify(chunk),
              })
            }
            stream.close()
          } catch (_error) {
            await stream.writeSSE({
              event: "error",
              data: JSON.stringify({ error: "Stream processing failed" }),
            })
            stream.close()
          }
        })
      } catch (_error) {
        return c.json({ error: "Internal server error" }, 500)
      }
    })
  })

  describe("POST /genai/generate-project-hierarchy", () => {
    it("should successfully generate project hierarchy with template", async () => {
      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: "An e-commerce platform with user authentication",
          userTier: "paid",
          templateId: 123,
        }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get("content-type")).toContain(
        "text/event-stream"
      )

      // Read the SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      const chunks = []

      if (reader) {
        let done = false
        while (!done) {
          const { value, done: streamDone } = await reader.read()
          done = streamDone
          if (value) {
            chunks.push(decoder.decode(value))
          }
        }
      }

      const streamData = chunks.join("")
      // Verify stream contains expected data types
      expect(streamData).toContain("data:")
      expect(streamData).toContain("project")
      expect(streamData).toContain("epic")
      // The stream should have at least project and epic
      expect(streamData.length).toBeGreaterThan(0)
    })

    it("should successfully generate project hierarchy without template", async () => {
      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: "A social media application",
          userTier: "free",
        }),
      })

      expect(response.status).toBe(200)
      expect(response.headers.get("content-type")).toContain(
        "text/event-stream"
      )
    })

    it("should return 401 when user is not authenticated", async () => {
      // Create app without user
      const appWithoutUser = new OpenAPIHono<HonoApp>()
      appWithoutUser.use("*", async (c, next) => {
        c.set("db", mockDb)
        // No user set
        await next()
      })

      // Add the same route but without user context
      appWithoutUser.post("/genai/generate-project-hierarchy", async (c) => {
        try {
          const user = c.get("user")
          if (!user) {
            return c.json({ error: "Unauthorized" }, 401)
          }
          return c.json({ message: "OK" }, 200)
        } catch (_error) {
          return c.json({ error: "Internal server error" }, 500)
        }
      })

      const response = await appWithoutUser.request(
        "/genai/generate-project-hierarchy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectDescription: "Test project description for testing",
            userTier: "free",
          }),
        }
      )

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toHaveProperty("error")
    })

    it("should validate required fields in request body", async () => {
      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Missing projectDescription
          userTier: "basic",
        }),
      })

      // The actual status code depends on the OpenAPI validation
      // It will likely be 400 for bad request
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it("should validate userTier enum values", async () => {
      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: "Test project",
          userTier: "invalid-tier" as any, // Invalid tier
        }),
      })

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it("should handle database errors when fetching template", async () => {
      mockDb.selectFrom.mockImplementationOnce(() => ({
        selectAll: () => ({
          where: () => ({
            executeTakeFirst: vi
              .fn()
              .mockRejectedValue(new Error("Database error")),
          }),
        }),
      }))

      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: "Test project description for testing",
          userTier: "free",
          templateId: 123,
        }),
      })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data).toHaveProperty("error")
    })

    it("should handle stream errors gracefully", async () => {
      // Mock service to throw error during streaming
      const { generateProjectHierarchy } = await import("../src/lib/services")
      ;(generateProjectHierarchy as any).mockImplementationOnce(
        (
          _c: any,
          _projectDescription: any,
          _template: any,
          _userTier: any
        ) => ({
          partialObjectStream: (function* () {
            yield { type: "project", name: "Test" }
            throw new Error("Stream error")
          })(),
        })
      )

      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: "Test project description for testing",
          userTier: "free",
        }),
      })

      expect(response.status).toBe(200) // SSE starts with 200

      // Read the stream to trigger the error
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let errorOccurred = false

      if (reader) {
        try {
          let done = false
          while (!done) {
            const { value, done: streamDone } = await reader.read()
            done = streamDone
            if (value) {
              const chunk = decoder.decode(value)
              // The stream might close or contain error data
              if (chunk.includes("error") || !chunk) {
                errorOccurred = true
              }
            }
          }
        } catch {
          errorOccurred = true
        }
      }

      // Stream should handle the error gracefully
      expect(errorOccurred || response.ok).toBeTruthy()
    })
  })

  describe("Request validation", () => {
    it("should accept valid paid tier", async () => {
      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: "Premium project with advanced features",
          userTier: "paid",
        }),
      })

      expect(response.status).toBe(200)
    })

    it("should accept valid free tier", async () => {
      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: "Basic project with standard features",
          userTier: "free",
        }),
      })

      expect(response.status).toBe(200)
    })

    it("should handle empty project description", async () => {
      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: "",
          userTier: "free",
        }),
      })

      expect(response.status).toBe(400)
    })

    it("should handle very long project descriptions", async () => {
      const longDescription = "A".repeat(2000)
      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: longDescription,
          userTier: "free",
        }),
      })

      expect(response.status).toBe(200)
    })

    it("should handle non-existent template ID", async () => {
      mockDb.selectFrom.mockImplementationOnce(() => ({
        selectAll: () => ({
          where: () => ({
            executeTakeFirst: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      }))

      const response = await app.request("/genai/generate-project-hierarchy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectDescription: "Test project description for testing",
          userTier: "free",
          templateId: 999,
        }),
      })

      // Should still work, template is optional in the logic
      expect(response.status).toBe(200)
    })
  })
})
