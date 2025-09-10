import type { FastifyReply, FastifyRequest } from "fastify"
import { beforeEach, describe, expect, it } from "vitest"
import { createCorsMiddleware } from "./cors"

describe("CORS Middleware Security", () => {
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>
  let headers: Record<string, string>

  beforeEach(() => {
    headers = {}
    mockRequest = {
      method: "GET",
      headers: {
        origin: "https://example.com",
      },
    }
    mockReply = {
      header: (key: string, value: string) => {
        headers[key] = value
        return mockReply as FastifyReply
      },
      status: () => mockReply as FastifyReply,
      send: () => mockReply as FastifyReply,
    }
  })

  describe("Credentials with wildcard origin vulnerability", () => {
    it("should NOT set wildcard origin when credentials are true", async () => {
      const middleware = createCorsMiddleware({
        origin: true,
        credentials: true,
        originAllowList: ["https://malicious.com"],
      })

      mockRequest.headers = { origin: "https://malicious.com" }
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(headers["Access-Control-Allow-Origin"]).toBe(
        "https://malicious.com"
      )
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true")
      expect(headers["Access-Control-Allow-Origin"]).not.toBe("*")
    })

    it("should NOT set origin header when credentials are true and no origin is provided", async () => {
      const middleware = createCorsMiddleware({
        origin: true,
        credentials: true,
      })

      mockRequest.headers = {}
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined()
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true")
    })

    it("should allow wildcard when credentials are false", async () => {
      const middleware = createCorsMiddleware({
        origin: true,
        credentials: false,
      })

      mockRequest.headers = {}
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(headers["Access-Control-Allow-Origin"]).toBe("*")
      expect(headers["Access-Control-Allow-Credentials"]).toBeUndefined()
    })

    it("should handle OPTIONS preflight with credentials correctly", async () => {
      const middleware = createCorsMiddleware({
        origin: true,
        credentials: true,
        originAllowList: ["https://trusted.com"],
      })

      mockRequest.method = "OPTIONS"
      mockRequest.headers = { origin: "https://trusted.com" }
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(headers["Access-Control-Allow-Origin"]).toBe("https://trusted.com")
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true")
      expect(headers["Access-Control-Allow-Origin"]).not.toBe("*")
    })

    it("should not set wildcard in OPTIONS when credentials true and no origin", async () => {
      const middleware = createCorsMiddleware({
        origin: true,
        credentials: true,
      })

      mockRequest.method = "OPTIONS"
      mockRequest.headers = {}
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined()
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true")
    })
  })

  describe("Array origin configuration", () => {
    it("should only allow whitelisted origins", async () => {
      const middleware = createCorsMiddleware({
        origin: ["https://trusted1.com", "https://trusted2.com"],
        credentials: true,
      })

      mockRequest.headers = { origin: "https://trusted1.com" }
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(headers["Access-Control-Allow-Origin"]).toBe(
        "https://trusted1.com"
      )
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true")
    })

    it("should not set origin for non-whitelisted domains", async () => {
      const middleware = createCorsMiddleware({
        origin: ["https://trusted1.com", "https://trusted2.com"],
        credentials: true,
      })

      mockRequest.headers = { origin: "https://malicious.com" }
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined()
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true")
    })
  })

  describe("String origin configuration", () => {
    it("should set specific origin regardless of request origin", async () => {
      const middleware = createCorsMiddleware({
        origin: "https://myapp.com",
        credentials: true,
      })

      mockRequest.headers = { origin: "https://other.com" }
      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(headers["Access-Control-Allow-Origin"]).toBe("https://myapp.com")
      expect(headers["Access-Control-Allow-Credentials"]).toBe("true")
    })
  })
})
