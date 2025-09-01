import { vi } from "vitest"

// In-memory user storage for tests
const users = new Map<string, any>()
const sessions = new Map<string, any>()

let queryContext: any = {}

export const mockDb = {
  transaction: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockImplementation(async (callback: any) => {
      // Simply execute the callback with the mock db
      return await callback(mockDb)
    }),
  })),
  selectFrom: vi.fn().mockImplementation((table: string) => {
    queryContext = { table }
    return mockDb
  }),
  select: vi.fn().mockReturnThis(),
  selectAll: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockImplementation(function (
    this: any,
    field: string | any,
    op?: string,
    value?: any
  ) {
    // Handle function-based where clause
    if (typeof field === "function") {
      return this
    }

    // Store the query context for later use
    if (typeof field === "string") {
      queryContext.whereField = field
      queryContext.whereOp = op
      queryContext.whereValue = value
    }
    return this
  }),
  executeTakeFirst: vi.fn().mockImplementation(function (this: any) {
    // Handle session queries
    if (queryContext.table === "sessions") {
      // If searching for session by id
      if (
        queryContext.whereField === "id" ||
        queryContext.whereField === "sessions.id"
      ) {
        for (const session of sessions.values()) {
          if (session.id === queryContext.whereValue) {
            // Return session with proper field names
            return {
              id: session.id,
              userId: session.userId || session.user_id,
              expiresAt: session.expiresAt || session.expires_at,
            }
          }
        }
      }
      return null
    }

    // Handle user queries
    if (
      queryContext.whereField === "email" ||
      queryContext.whereField === "users.email"
    ) {
      return users.get(queryContext.whereValue) || null
    }
    if (
      queryContext.whereField === "id" ||
      queryContext.whereField === "users.id"
    ) {
      for (const user of users.values()) {
        if (user.id === queryContext.whereValue) return user
      }
    }
    return null
  }),
  execute: vi.fn().mockResolvedValue([]),
  insertInto: vi.fn().mockImplementation((table: string) => ({
    values: vi.fn().mockImplementation((data: any) => ({
      returningAll: vi.fn().mockImplementation(() => ({
        executeTakeFirst: vi.fn().mockImplementation(() => {
          if (table === "users") {
            // Check if user already exists
            if (users.has(data.email)) {
              throw new Error("User already exists")
            }
            // Create new user
            const newUser = {
              ...data,
              id: data.id || Math.random().toString(36).substring(7),
              hashedPassword: data.hashedPassword || data.password,
              emailVerifiedAt: data.emailVerifiedAt || null,
              isActive: data.isActive !== undefined ? data.isActive : true,
              isSuperAdmin: data.isSuperAdmin || false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            users.set(data.email, newUser)
            return newUser
          }
          if (table === "sessions") {
            const session = {
              ...data,
              id: data.id || Math.random().toString(36).substring(7),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            sessions.set(session.id, session)
            return session
          }
          return data
        }),
      })),
      execute: vi.fn().mockImplementation(() => {
        // Handle sessions without returningAll
        if (table === "sessions") {
          const session = {
            ...data,
            id: data.id || Math.random().toString(36).substring(7),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          sessions.set(session.id, session)
          return undefined
        }
        return undefined
      }),
    })),
  })),
  deleteFrom: vi.fn().mockImplementation((table: string) => ({
    where: vi
      .fn()
      .mockImplementation((field: string | any, op?: string, value?: any) => ({
        execute: vi.fn().mockImplementation(() => {
          const targetValue = value !== undefined ? value : op

          if (table === "users" && (field === "id" || field === "users.id")) {
            for (const [email, user] of users.entries()) {
              if (user.id === targetValue) {
                users.delete(email)
                // Also delete user's sessions
                for (const [id, session] of sessions.entries()) {
                  if (session.user_id === targetValue) {
                    sessions.delete(id)
                  }
                }
                break
              }
            }
          }
          if (
            table === "sessions" &&
            (field === "user_id" || field === "sessions.user_id")
          ) {
            for (const [id, session] of sessions.entries()) {
              if (session.user_id === targetValue) {
                sessions.delete(id)
              }
            }
          }
          if (
            table === "sessions" &&
            (field === "id" || field === "sessions.id")
          ) {
            sessions.delete(targetValue)
          }
        }),
        returningAll: vi.fn().mockImplementation(() => ({
          executeTakeFirst: vi.fn().mockImplementation(() => {
            const targetValue = value !== undefined ? value : op
            let deletedItem = null

            if (table === "users" && (field === "id" || field === "users.id")) {
              for (const [email, user] of users.entries()) {
                if (user.id === targetValue) {
                  deletedItem = { ...user }
                  users.delete(email)
                  // Also delete user's sessions
                  for (const [id, session] of sessions.entries()) {
                    if (session.user_id === targetValue) {
                      sessions.delete(id)
                    }
                  }
                  break
                }
              }
            }
            return deletedItem
          }),
        })),
      })),
  })),
  updateTable: vi.fn().mockImplementation((table: string) => ({
    set: vi.fn().mockImplementation((updates: any) => ({
      where: vi
        .fn()
        .mockImplementation(
          (field: string | any, op?: string, value?: any) => ({
            execute: vi.fn().mockImplementation(() => {
              const targetValue = value !== undefined ? value : op

              if (
                table === "users" &&
                (field === "id" || field === "users.id")
              ) {
                for (const user of users.values()) {
                  if (user.id === targetValue) {
                    Object.assign(user, updates, { updated_at: new Date() })
                    break
                  }
                }
              }
            }),
          })
        ),
    })),
  })),
}

// Helper to reset the mock database between tests
export function resetMockDb() {
  users.clear()
  sessions.clear()
  queryContext = {}

  // Add test user that already exists
  users.set("user1@example.com", {
    id: "user1",
    email: "user1@example.com",
    fullName: "User 1",
    hashedPassword: "hashed_user1", // This matches our bcrypt mock
    emailVerifiedAt: new Date().toISOString(),
    isActive: true,
    isSuperAdmin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  // Add unverified user for email verification tests
  users.set("user2@example.com", {
    id: "user2",
    email: "user2@example.com",
    fullName: "User 2",
    hashedPassword: "hashed_user2",
    emailVerifiedAt: null,
    isActive: true,
    isSuperAdmin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

// Helper to create a session for testing
export function createMockSession(userId: string, sessionId = "test-session") {
  const session = {
    id: sessionId,
    user_id: userId,
    created_at: new Date(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  }
  sessions.set(sessionId, session)
  return session
}
