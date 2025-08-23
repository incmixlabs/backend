import bcrypt from "bcrypt"
import { afterEach, beforeAll, beforeEach, vi } from "vitest"
import { mockDb, resetMockDb } from "./db-mock"

// Create a mock function for fetch
const mockFetch = vi.fn()

// Mock the database module
vi.mock("@incmix-api/utils/db-schema", () => ({
  initDb: vi.fn(() => mockDb),
}))

// Mock session utils to generate predictable IDs
vi.mock("@/auth/utils", () => ({
  generateSessionId: vi.fn(() => `session-${Date.now()}`),
  generateRandomId: vi.fn(() => `id-${Date.now()}`),
  hashPassword: vi.fn(async (password: string) => `hashed_${password}`),
  verifyPassword: vi.fn(async (hash: string, password: string) => {
    return (
      hash === `hashed_${password}` ||
      (password === "user1" && hash === "hashed_user1")
    )
  }),
}))

// Mock bcrypt for password operations
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockImplementation(async (password: string) => {
      return `hashed_${password}`
    }),
    compare: vi
      .fn()
      .mockImplementation(async (password: string, hash: string) => {
        // Simple mock comparison - in real tests you'd want proper bcrypt
        return (
          hash === `hashed_${password}` ||
          (password === "user1" && hash.includes("user1"))
        )
      }),
  },
}))

// Mock session creation
vi.mock("@/auth/session", () => ({
  createSession: vi.fn(async (db: any, userId: string) => {
    const session = {
      id: `session-${Date.now()}`,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      fresh: true,
    }
    // Store session in mock db
    await db.insertInto("sessions").values(session).execute()
    return session
  }),
  invalidateSession: vi.fn(async (db: any, sessionId: string) => {
    await db.deleteFrom("sessions").where("id", "=", sessionId).execute()
  }),
  invalidateAllSessions: vi.fn(async (db: any, userId: string) => {
    await db.deleteFrom("sessions").where("user_id", "=", userId).execute()
  }),
  validateSession: vi.fn(async (db: any, sessionId: string) => {
    const session = await db
      .selectFrom("sessions")
      .select(["id", "userId", "expiresAt"])
      .where("id", "=", sessionId)
      .executeTakeFirst()
    return session || null
  }),
}))

// Mock cookie functions
vi.mock("@/auth/cookies", () => ({
  setSessionCookie: vi.fn((c: any, sessionId: string, _expiresAt: Date) => {
    c.header(
      "Set-Cookie",
      `auth-session=${sessionId}; Path=/; HttpOnly; SameSite=None; Secure=false`
    )
  }),
  deleteSessionCookie: vi.fn((c: any) => {
    c.header(
      "Set-Cookie",
      "auth-session=; Path=/; HttpOnly; SameSite=None; Max-Age=0"
    )
  }),
}))

// Mock getCookie from hono/cookie
vi.mock("hono/cookie", () => ({
  getCookie: vi.fn((c: any, name: string) => {
    const cookieHeader = c.req.header("cookie")
    if (!cookieHeader) return undefined
    const cookies = cookieHeader.split(";").map((c: string) => c.trim())
    const cookie = cookies.find((c: string) => c.startsWith(`${name}=`))
    return cookie ? cookie.split("=")[1] : undefined
  }),
}))

// Mock env function from hono/adapter
vi.mock("hono/adapter", () => ({
  env: vi.fn(() => ({
    COOKIE_NAME: "auth-session",
    DOMAIN: "localhost",
    NODE_ENV: "test",
    USERS_API_URL: "http://localhost/api/users",
    DATABASE_URL: "test://localhost",
  })),
}))

beforeAll(() => {
  // Replace global fetch with our mock
  global.fetch = mockFetch as any

  // Set up default mock implementation
  mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
    // Mock INTL service responses
    if (url.includes("/locales/default")) {
      return {
        ok: true,
        json: async () => ({ code: "en", is_default: true }),
      }
    }

    if (url.includes("/api/intl")) {
      return {
        ok: true,
        json: async () => [],
      }
    }

    // Mock email service responses
    if (url.includes("/api/email")) {
      return {
        ok: true,
        json: async () => ({ message: "Mail sent" }),
      }
    }

    // Mock users service responses
    if (url.includes("/api/users")) {
      if (options?.method?.toLowerCase() === "delete") {
        return {
          ok: true,
          json: async () => ({ message: "User profile deleted" }),
        }
      }
      return {
        ok: true,
        json: async () => ({
          fullName: "John Doe",
          email: "john.doe@example.com",
          localeId: 1,
        }),
      }
    }

    // Default response for unknown URLs
    return {
      ok: false,
      json: async () => ({ message: "Not found" }),
    }
  })
})

beforeEach(() => {
  resetMockDb()
})

afterEach(() => {
  vi.clearAllMocks()
})
