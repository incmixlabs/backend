import { DEFAULT_LOCALE, DEFAULT_MESSAGES } from "@incmix-api/utils"
import type { Locale } from "@incmix-api/utils/db-schema"
import type { KVStore } from "@incmix-api/utils/kv-store"
import type { FastifyReply, FastifyRequest } from "fastify"
import { vi } from "vitest"

// Mock fetch for external API calls
export const mockFetch = vi.fn()

// Mock internationalization service responses
export function createi18nMockPlugin() {
  const mockLocale: Locale = {
    id: 1,
    code: "en",
    name: "English",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return (fastify: any) => {
    fastify.addHook(
      "onRequest",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const kv = (request as any).kv as KVStore
        ;(request as any).locale = mockLocale.code
        await kv.getItem(DEFAULT_LOCALE, {
          fn: () => Promise.resolve(mockLocale),
        })

        const locale = "en"
        ;(request as any).locale = locale
        await kv.getItem(locale, { fn: () => Promise.resolve([]) })
        await kv.getItem(DEFAULT_MESSAGES, { fn: () => Promise.resolve([]) })

        reply.header("content-language", locale)
      }
    )
  }
}

const MockUser = {
  id: "test-user-id",
  email: "test@example.com",
  fullName: "Test User",
  emailVerified: true,
  isActive: true,
  isSuperAdmin: false,
}

const mockAdminUser = {
  id: "test-admin-user-id",
  email: "test-admin@example.com",
  fullName: "Test Admin User",
  emailVerified: true,
  isActive: true,
  isSuperAdmin: true,
}

export const mockApi = () => {
  mockFetch.mockImplementation(
    (url: string | URL | Request, _options?: RequestInit) => {
      let urlString: string

      if (typeof url === "string") {
        urlString = url
      } else if (url instanceof URL) {
        urlString = url.toString()
      } else if (url instanceof Request) {
        urlString = url.url
      } else {
        urlString = String(url)
      }
      // Mock email service responses
      if (
        urlString.includes("/api/email") ||
        urlString.includes("localhost:8989")
      ) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: "Mail sent successfully",
            id: "test-email-id",
          }),
        } as Response)
      }
      return Promise.resolve({
        ok: false,
        status: 404,
      } as Response)
    }
  )
}

export function createAuthMockPlugin() {
  return (fastify: any) => {
    fastify.addHook(
      "onRequest",
      (request: FastifyRequest, _reply: FastifyReply) => {
        const cookieName = "incmix_session_dev"
        // For testing, we'll get cookies from headers since @fastify/cookie might not be registered
        const cookieHeader = request.headers.cookie || ""
        const cookies = cookieHeader
          .split(";")
          .reduce((acc: Record<string, string>, cookie) => {
            const [key, value] = cookie.trim().split("=")
            if (key && value) {
              acc[key] = value
            }
            return acc
          }, {})

        const sessionId = cookies[cookieName] ?? null

        if (!sessionId) {
          ;(request as any).user = null
          return
        }

        let user = MockUser
        if (sessionId === "test-admin-session") {
          user = mockAdminUser
        }

        ;(request as any).user = user
      }
    )
  }
}

// Mock environment variables for testing
export function setupTestEnv() {
  return {
    NODE_ENV: "test",
    COOKIE_NAME: "incmix_session_dev",
    DOMAIN: "localhost",
    INTL_API_URL: "http://localhost:9090/api/intl",
    EMAIL_API_URL: "http://localhost:8989/api/email",
    FRONTEND_URL: "http://localhost:1420",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    GOOGLE_REDIRECT_URL: "http://localhost:1420/auth/google/callback",
  }
}

// Mock Fastify request and reply utilities
export function createMockRequest(overrides: any = {}) {
  return {
    headers: {
      "content-type": "application/json",
      "user-agent": "test-agent",
      ...overrides.headers,
    },
    url: "/api/auth/test",
    method: "GET",
    ...overrides,
  }
}

export function createMockReply(overrides: any = {}) {
  return {
    code: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    ...overrides,
  }
}

// Reset all mocks
export function resetMocks() {
  vi.clearAllMocks()
}
