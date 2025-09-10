import type { FastifyReply, FastifyRequest } from "fastify"

export interface AuthContext {
  userId?: string
  sessionId?: string
  permissions?: string[]
  [key: string]: any
}

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext
  }
}

export function createAuthMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      })
    }

    const token = authHeader.substring(7)

    try {
      // TODO: Implement actual token validation logic
      // This is a placeholder that should be replaced with your actual auth logic
      const authContext = await validateToken(token)
      request.auth = authContext
    } catch (_error) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid or expired token",
      })
    }
  }
}

export function createOptionalAuthMiddleware() {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const authHeader = request.headers.authorization

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)

      try {
        const authContext = await validateToken(token)
        request.auth = authContext
      } catch (_error) {
        // For optional auth, we don't return an error, just skip setting auth
      }
    }
  }
}

// Placeholder function - replace with your actual token validation logic
async function validateToken(_token: string): Promise<AuthContext> {
  // This should be replaced with your actual JWT verification, session lookup, etc.
  throw new Error("Token validation not implemented")
}
