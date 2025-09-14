import type { FastifyReply, FastifyRequest } from "fastify"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { envVars } from "../../src/env-vars"
import { getOauthCookies, setOauthCookie } from "../../src/routes/oauth"

vi.mock("../../src/lib/oauth", () => ({
  initializeGoogleAuth: vi.fn().mockReturnValue({
    createAuthorizationURL: vi.fn(),
    validateAuthorizationCode: vi.fn(),
  }),
}))

describe("OAuth Helper Functions", () => {
  describe("setOauthCookie", () => {
    let mockReply: Partial<FastifyReply>
    let headerSpy: ReturnType<typeof vi.fn>

    beforeEach(() => {
      headerSpy = vi.fn()
      mockReply = {
        header: headerSpy,
      }
    })

    it("should set cookie with correct attributes for production environment", () => {
      const originalEnv = envVars.NODE_ENV
      const originalDomain = envVars.DOMAIN
      vi.stubEnv("NODE_ENV", "prod")
      Object.defineProperty(envVars, "NODE_ENV", {
        value: "prod",
        configurable: true,
      })
      Object.defineProperty(envVars, "DOMAIN", {
        value: "example.com",
        configurable: true,
      })

      setOauthCookie(
        mockReply as FastifyReply,
        "test_cookie",
        "test_value",
        600
      )

      expect(headerSpy).toHaveBeenCalledWith(
        "Set-Cookie",
        "test_cookie=test_value; Path=/; HttpOnly; SameSite=None; Max-Age=600; Secure; Domain=example.com"
      )

      Object.defineProperty(envVars, "NODE_ENV", {
        value: originalEnv,
        configurable: true,
      })
      Object.defineProperty(envVars, "DOMAIN", {
        value: originalDomain,
        configurable: true,
      })
    })

    it("should set cookie without Secure flag for non-production environment", () => {
      const originalEnv = envVars.NODE_ENV
      const originalDomain = envVars.DOMAIN
      Object.defineProperty(envVars, "NODE_ENV", {
        value: "dev",
        configurable: true,
      })
      Object.defineProperty(envVars, "DOMAIN", {
        value: "example.com",
        configurable: true,
      })

      setOauthCookie(
        mockReply as FastifyReply,
        "test_cookie",
        "test_value",
        3600
      )

      expect(headerSpy).toHaveBeenCalledWith(
        "Set-Cookie",
        "test_cookie=test_value; Path=/; HttpOnly; SameSite=None; Max-Age=3600; Domain=example.com"
      )

      Object.defineProperty(envVars, "NODE_ENV", {
        value: originalEnv,
        configurable: true,
      })
      Object.defineProperty(envVars, "DOMAIN", {
        value: originalDomain,
        configurable: true,
      })
    })

    it("should not include Domain attribute for localhost", () => {
      const originalDomain = envVars.DOMAIN
      Object.defineProperty(envVars, "DOMAIN", {
        value: "localhost",
        configurable: true,
      })

      setOauthCookie(
        mockReply as FastifyReply,
        "test_cookie",
        "test_value",
        1200
      )

      expect(headerSpy).toHaveBeenCalledWith(
        "Set-Cookie",
        "test_cookie=test_value; Path=/; HttpOnly; SameSite=None; Max-Age=1200"
      )

      Object.defineProperty(envVars, "DOMAIN", {
        value: originalDomain,
        configurable: true,
      })
    })

    it("should not include Domain attribute for IP addresses", () => {
      const originalDomain = envVars.DOMAIN
      Object.defineProperty(envVars, "DOMAIN", {
        value: "192.168.1.1",
        configurable: true,
      })

      setOauthCookie(mockReply as FastifyReply, "ip_cookie", "ip_value", 900)

      expect(headerSpy).toHaveBeenCalledWith(
        "Set-Cookie",
        "ip_cookie=ip_value; Path=/; HttpOnly; SameSite=None; Max-Age=900"
      )

      Object.defineProperty(envVars, "DOMAIN", {
        value: originalDomain,
        configurable: true,
      })
    })

    it("should handle undefined domain correctly", () => {
      const originalDomain = envVars.DOMAIN
      Object.defineProperty(envVars, "DOMAIN", {
        value: undefined,
        configurable: true,
      })

      setOauthCookie(mockReply as FastifyReply, "no_domain", "value", 300)

      expect(headerSpy).toHaveBeenCalledWith(
        "Set-Cookie",
        "no_domain=value; Path=/; HttpOnly; SameSite=None; Max-Age=300"
      )

      Object.defineProperty(envVars, "DOMAIN", {
        value: originalDomain,
        configurable: true,
      })
    })
  })

  describe("getOauthCookies", () => {
    let mockRequest: Partial<FastifyRequest>

    beforeEach(() => {
      mockRequest = {
        headers: {},
      }
    })

    it("should extract client_type cookie correctly when present", () => {
      mockRequest.headers = {
        cookie: "client_type=desktop; other_cookie=value; session=abc123",
      }

      const result = getOauthCookies(mockRequest as FastifyRequest)

      expect(result.cookies).toBe(
        "client_type=desktop; other_cookie=value; session=abc123"
      )
      expect(result.clientTypeCookie).toBe("desktop")
      expect(result.google).toBeDefined()
    })

    it("should default client_type to 'web' when cookie is not present", () => {
      mockRequest.headers = {
        cookie: "other_cookie=value; session=abc123",
      }

      const result = getOauthCookies(mockRequest as FastifyRequest)

      expect(result.cookies).toBe("other_cookie=value; session=abc123")
      expect(result.clientTypeCookie).toBe("web")
      expect(result.google).toBeDefined()
    })

    it("should handle missing cookie header gracefully", () => {
      mockRequest.headers = {}

      const result = getOauthCookies(mockRequest as FastifyRequest)

      expect(result.cookies).toBe("")
      expect(result.clientTypeCookie).toBe("web")
      expect(result.google).toBeDefined()
    })

    it("should handle empty cookie header", () => {
      mockRequest.headers = {
        cookie: "",
      }

      const result = getOauthCookies(mockRequest as FastifyRequest)

      expect(result.cookies).toBe("")
      expect(result.clientTypeCookie).toBe("web")
      expect(result.google).toBeDefined()
    })

    it("should correctly parse client_type=web", () => {
      mockRequest.headers = {
        cookie: "client_type=web",
      }

      const result = getOauthCookies(mockRequest as FastifyRequest)

      expect(result.clientTypeCookie).toBe("web")
    })

    it("should handle malformed cookie strings", () => {
      mockRequest.headers = {
        cookie: "client_type=; other_cookie=value",
      }

      const result = getOauthCookies(mockRequest as FastifyRequest)

      expect(result.cookies).toBe("client_type=; other_cookie=value")
      expect(result.clientTypeCookie).toBe("web")
    })

    it("should handle cookies with spaces in values", () => {
      mockRequest.headers = {
        cookie: "client_type=mobile app; session=xyz",
      }

      const result = getOauthCookies(mockRequest as FastifyRequest)

      expect(result.clientTypeCookie).toBe("mobile app")
    })
  })
})
