import type { AuthUser } from "@incmix/utils/types"
import { envVars } from "@incmix-api/utils/env-config"
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
    user?: AuthUser | null
  }
}

function getCookieFromHeader(
  request: FastifyRequest,
  cookieName: string
): string | null {
  const cookieHeader = request.headers.cookie
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(";").map((cookie: string) => cookie.trim())
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=")
    if (name === cookieName) {
      return decodeURIComponent(value)
    }
  }
  return null
}

export function createAuthMiddleware() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Check for session cookie first
    const cookieName = (envVars.COOKIE_NAME ?? "session") as string
    const sessionId =
      (request as any).cookies?.[cookieName] ||
      getCookieFromHeader(request, cookieName)

    if (sessionId) {
      try {
        const user = await validateSession(sessionId)
        if (user) {
          request.user = user
          request.auth = {
            userId: user.id,
            sessionId,
          }
          return
        }
      } catch (_error) {
        // Session validation failed, try other auth methods
      }
    }

    // Fall back to Bearer token
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Missing or invalid authorization",
      })
    }

    const token = authHeader.substring(7)

    try {
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
    // Check for session cookie first
    const cookieName = (envVars.COOKIE_NAME ?? "session") as string
    const sessionId =
      (request as any).cookies?.[cookieName] ||
      getCookieFromHeader(request, cookieName)

    if (sessionId) {
      try {
        const user = await validateSession(sessionId)
        if (user) {
          request.user = user
          request.auth = {
            userId: user.id,
            sessionId,
          }
          return
        }
      } catch (_error) {
        // Session validation failed, continue without auth
      }
    }

    // Try Bearer token
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

    // If no auth found, set user to null
    if (!request.user && !request.auth) {
      request.user = null
    }
  }
}

// Validate session with auth service
async function validateSession(sessionId: string): Promise<AuthUser | null> {
  const authApiUrl = envVars.AUTH_API_URL
  if (!authApiUrl) {
    console.error("AUTH_API_URL is not configured")
    return null
  }

  const cookieName = (envVars.COOKIE_NAME ?? "session") as string
  const authUrl = `${authApiUrl}/me`

  try {
    const res = await fetch(authUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: `${cookieName}=${sessionId}`,
      },
    })

    if (!res.ok) {
      return null
    }

    const user = (await res.json()) as AuthUser
    return user || null
  } catch (error) {
    console.error("Session validation error:", error)
    return null
  }
}

// Placeholder function - replace with your actual token validation logic
async function validateToken(_token: string): Promise<AuthContext> {
  // This should be replaced with your actual JWT verification, session lookup, etc.
  throw new Error("Token validation not implemented")
}
