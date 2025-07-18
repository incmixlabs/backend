// Session interface for custom authentication
export interface Session {
  id: string
  userId: string
  expiresAt: string // ISO string
  fresh: boolean
}

// Optionally, define a type for the DB pool (PostgreSQL)
export type DBPool = import("pg").Pool

// Optionally, define a type for the HTTP response (Hono context)
export type HTTPResponse = import("hono").Context
