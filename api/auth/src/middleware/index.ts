import { randomUUID } from "node:crypto"
import type { FastifyInstance } from "fastify"

// Basic function to get cookie from request headers
function _getCookieFromHeader(request: any, cookieName: string): string | null {
  const cookieHeader = request.headers?.cookie
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
export const setupMiddleware = (app: FastifyInstance) => {
  // Basic request logging

  app.addHook("onRequest", (request, reply) => {
    const incoming = request.headers["x-request-id"] as string | undefined
    const requestId = incoming ?? request.id ?? randomUUID()
    reply.header("X-Request-Id", requestId)
  })
}
