import type {
  Database,
  NewSession,
  NewUser,
  User,
} from "@incmix-api/utils/db-schema"
import type { Kysely } from "kysely"
import { expect } from "vitest"
import type { Session } from "@/auth/types"
import { BASE_PATH } from "../../src/lib/constants"
import { routes } from "../../src/routes"

type Credentials = {
  email: string
  password: string
}

type SignupData = {
  email: string
  password: string
  fullName: string
}

// Create a test client using Fastify's inject method
export async function createTestClient() {
  // Try a simpler approach - create Fastify directly
  const Fastify = (await import("fastify")).default
  const fastifyCookie = (await import("@fastify/cookie")).default

  const testApp = Fastify({
    logger: false,
  })

  // Register cookie plugin first (required for auth routes)
  await testApp.register(fastifyCookie)

  // Register routes directly
  await routes(testApp)

  // Wait for ready state to ensure all plugins are loaded
  await testApp.ready()

  // List registered routes for debugging
  console.log("Registered routes:")
  testApp.printRoutes()

  // Add a request method that works with Fastify's inject
  const client = {
    request: async (path: string, options: RequestInit = {}) => {
      const fullPath = `${BASE_PATH}${path}`
      console.log(`Injecting request to: ${fullPath}`)
      const response = await testApp.inject({
        method: (options.method as any) || "GET",
        url: fullPath,
        headers: options.headers as Record<string, string>,
        payload: options.body as any,
      })
      console.log(`Response received from inject: ${response.statusCode}`)

      // Convert Fastify response to fetch-like response
      return {
        status: response.statusCode,
        ok: response.statusCode >= 200 && response.statusCode < 300,
        json: async () => JSON.parse(response.body),
        text: async () => response.body,
        headers: {
          get: (name: string) =>
            response.headers[name.toLowerCase()] as string | null,
        },
      } as any
    },
    close: async () => {
      await testApp.close()
    },
  }

  return client
}

export type TestAgent = Awaited<ReturnType<typeof createTestClient>>

export function createUser(overrides: Partial<User> = {}) {
  return {
    id: `user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
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

export function createSession(
  userId: string,
  overrides: Partial<Session> = {}
) {
  return {
    id: `session-${Date.now()}`,
    userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    fresh: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

export function createSignupData(overrides: Partial<SignupData> = {}) {
  return {
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123!",
    fullName: "Test User",
    ...overrides,
  }
}

export function createLoginData(overrides: Partial<Credentials> = {}) {
  return {
    email: "test@example.com",
    password: "TestPassword123!",
    ...overrides,
  }
}

// Authentication helpers

export async function loginUser(client: TestAgent, credentials: Credentials) {
  const { request } = client
  const response = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  })

  if (response.status !== 200) {
    throw new Error(`Login failed with status ${response.status}`)
  }

  const sessionCookie = response.headers.get("set-cookie")
  if (!sessionCookie) {
    throw new Error("No session cookie received")
  }

  return sessionCookie.split(";")[0] // Extract just the cookie value
}

export async function signupUser(client: TestAgent, userData: SignupData) {
  const { request } = client
  return await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(userData),
  })
}

export async function getAuthenticatedUser(
  client: TestAgent,
  sessionCookie: string
) {
  const { request } = client
  return await request("/api/auth/me", {
    method: "GET",
    headers: {
      cookie: sessionCookie,
    },
  })
}

export async function deleteUser(client: TestAgent, sessionCookie: string) {
  const { request } = client
  return await request("/api/auth/delete", {
    method: "DELETE",
    headers: {
      cookie: sessionCookie,
    },
  })
}

// Response helpers

export function expectSuccessResponse(
  response: Response,
  expectedStatus = 200
) {
  expect(response.ok).toBe(true)
  expect(response.status).toBe(expectedStatus)
}

export function expectErrorResponse(
  response: Response,
  expectedStatus: number
) {
  expect(response.ok).toBe(false)
  expect(response.status).toBe(expectedStatus)
}

export function expectValidationError(response: Response) {
  expect(response.ok).toBe(false)
  expect(response.status).toBe(422)
}

export function expectUnauthorized(response: Response) {
  expect(response.ok).toBe(false)
  expect(response.status).toBe(401)
}

export function expectForbidden(response: Response) {
  expect(response.ok).toBe(false)
  expect(response.status).toBe(403)
}

export function expectNotFound(response: Response) {
  expect(response.ok).toBe(false)
  expect(response.status).toBe(404)
}

// Database helpers

export async function createTestUser(db: Kysely<Database>, userData: NewUser) {
  return await db
    .insertInto("users")
    .values(userData)
    .returningAll()
    .executeTakeFirst()
}

export async function createTestSession(
  db: Kysely<Database>,
  sessionData: NewSession
) {
  return await db
    .insertInto("sessions")
    .values(sessionData)
    .returningAll()
    .executeTakeFirst()
}

export async function findUserByEmail(db: Kysely<Database>, email: string) {
  return await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst()
}

export async function findSessionById(db: Kysely<Database>, sessionId: string) {
  return await db
    .selectFrom("sessions")
    .selectAll()
    .where("id", "=", sessionId)
    .executeTakeFirst()
}

export async function deleteUserFromDb(db: Kysely<Database>, userId: string) {
  return await db
    .deleteFrom("users")
    .where("id", "=", userId)
    .executeTakeFirst()
}

export async function deleteSession(db: Kysely<Database>, sessionId: string) {
  return await db
    .deleteFrom("sessions")
    .where("id", "=", sessionId)
    .executeTakeFirst()
}
