import { createi18nMockMiddleware } from "@incmix-api/test-utils"
import { createService } from "@incmix-api/utils"
import type {
  Database,
  NewSession,
  NewUser,
  User,
} from "@incmix-api/utils/db-schema"
import { setupApiMiddleware } from "@incmix-api/utils/middleware"
import type { Kysely } from "kysely"
import { expect } from "vitest"
import { authMiddleware } from "@/auth/middleware"
import type { Session } from "@/auth/types"
import { BASE_PATH } from "../../src/lib/constants"
import { routes } from "../../src/routes"
import type { HonoApp } from "../../src/types"
import { envVars } from "./test-env"

type Credentials = {
  email: string
  password: string
}

type SignupData = {
  email: string
  password: string
  fullName: string
}

// Create a test client using Hono's testClient
export function createTestClient() {
  const connectionString = process.env.DATABASE_URL as string
  // Create the service without starting the server
  const service = createService<HonoApp["Bindings"], HonoApp["Variables"]>({
    name: "auth-api-test",
    port: (envVars.PORT as number) || 0, // Use test environment port or 0 to avoid conflicts
    basePath: BASE_PATH,
    setupMiddleware: (app) => {
      setupApiMiddleware(app, {
        basePath: BASE_PATH,
        serviceName: "auth-api-test",
        databaseUrl: connectionString,
        customAuthMiddleware: authMiddleware,
        customI18nMiddleware: createi18nMockMiddleware,
        corsFirst: true,
      })
    },
    needDB: true,
    databaseUrl: connectionString,
    setupRoutes: (app) => routes(app),
  })

  const { app: testApp } = service
  // Add a request method that works with the BASE_PATH
  const client = {
    request: async (path: string, options: RequestInit = {}) => {
      const fullPath = `${BASE_PATH}${path}`
      return await testApp.request(fullPath, options)
    },
  }

  return client
}

export type TestAgent = ReturnType<typeof createTestClient>

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
