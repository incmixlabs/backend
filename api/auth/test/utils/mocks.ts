import { vi } from "vitest"

// Mock fetch for external API calls
export const mockFetch = vi.fn()

// Mock internationalization service responses
export function setupIntlMocks() {
  mockFetch.mockImplementation((url: string | URL | Request, options?: RequestInit) => {
    let urlString: string

    if (typeof url === 'string') {
      urlString = url
    } else if (url instanceof URL) {
      urlString = url.toString()
    } else if (url instanceof Request) {
      urlString = url.url
    } else {
      urlString = String(url)
    }



    // Mock INTL service responses
    if (urlString.includes("/api/intl/locales/default")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          code: "en",
          is_default: true,
          id: 1,
          name: "English"
        }),
      } as Response)
    }

    if (urlString.includes("/api/intl/messages/")) {
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response)
    }

    // Mock email service responses
    if (urlString.includes("/api/email") || urlString.includes("localhost:8989")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          message: "Mail sent successfully",
          id: "test-email-id"
        }),
      } as Response)
    }


    // Default response for unknown URLs
    return Promise.resolve({
      ok: false,
      status: 404,
      json: async () => ({
        message: "Not found",
        error: "Service not available in test environment"
      }),
    } as Response)
  })
}

// Mock environment variables for testing
export function setupTestEnv() {
  return {
    NODE_ENV: "test",
    COOKIE_NAME: "incmix_session_dev",
    DOMAIN: "localhost",
    DATABASE_URL: process.env.TEST_DATABASE_URL || "postgresql://postgres:password@localhost:54322/incmix_test",
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

// Mock session utilities
export function createMockSession(userId: string, sessionId = "test-session-id") {
  return {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    fresh: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Mock user data
export function createMockUser(overrides: any = {}) {
  return {
    id: "test-user-id",
    email: "test@example.com",
    fullName: "Test User",
    hashedPassword: "$2b$10$test.hash.for.password",
    emailVerifiedAt: new Date().toISOString(),
    isActive: true,
    isSuperAdmin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// Reset all mocks
export function resetMocks() {
  vi.clearAllMocks()
  setupIntlMocks()
}
