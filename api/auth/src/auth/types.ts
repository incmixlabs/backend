// Session interface for custom authentication
export interface Session {
  id: string
  userId: string
  expiresAt: string // ISO string
  fresh: boolean
}

// Optionally, define a type for the DB pool (PostgreSQL)
export type DBPool = import("pg").Pool

// HTTP response type for Fastify
export type HTTPResponse = import("fastify").FastifyReply
