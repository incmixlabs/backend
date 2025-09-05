import { DEFAULT_LOCALE, DEFAULT_MESSAGES } from "@incmix-api/utils"
import type { Locale } from "@incmix-api/utils/db-schema"
import type { KVStore } from "@incmix-api/utils/kv-store"
import type { MiddlewareHandler } from "hono"
import { getCookie } from "hono/cookie"
import { vi } from "vitest"

// Mock fetch for external API calls
export const mockFetch = vi.fn()

// Mock internationalization service responses
export function createi18nMockMiddleware(): MiddlewareHandler {
  const mockLocale: Locale = {
    id: 1,
    code: "en",
    name: "English",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return async (c, next) => {
    const kv = c.get("kv") as KVStore
    c.set("locale", mockLocale.code)
    await kv.getItem(DEFAULT_LOCALE, { fn: () => Promise.resolve(mockLocale) })

    const locale = "en"

    c.set("locale", locale)
    await kv.getItem(locale, { fn: () => Promise.resolve([]) })
    await kv.getItem(DEFAULT_MESSAGES, { fn: () => Promise.resolve([]) })

    c.header("content-language", locale, { append: true })
    return await next()
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

export function createAuthMockMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const cookieName = "incmix_session_dev"
    const sessionId = getCookie(c, cookieName) ?? null

    if (!sessionId) {
      c.set("user", null)
      return await next()
    }

    let user = MockUser
    if (sessionId === "test-admin-session") {
      user = mockAdminUser
    }

    c.set("user", user)
    return await next()
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

// Mock Hono context utilities
export function createMockContext(overrides: any = {}) {
  return {
    req: {
      header: vi.fn((name: string) => {
        const headers = {
          "content-type": "application/json",
          "user-agent": "test-agent",
          ...overrides.headers,
        }
        return headers[name.toLowerCase()]
      }),
      url: "http://localhost:8787/api/auth/test",
      method: "GET",
      ...overrides.req,
    },
    res: {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      ...overrides.res,
    },
    set: vi.fn(),
    get: vi.fn(),
    ...overrides,
  }
}

// Reset all mocks
export function resetMocks() {
  vi.clearAllMocks()
}
