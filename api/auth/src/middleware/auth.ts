import type { KyselyDb } from "@incmix-api/utils/db-schema"
import type { FastifyReply, FastifyRequest } from "fastify"
import { validateSession } from "@/auth/session"
import type { Session } from "@/auth/types"
import { envVars } from "@/env-vars"
import type { AuthUser } from "@/types"

// Extend Fastify request to include auth properties
declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser
    session?: Session
  }
}
async function _findUserByIdDb(db: KyselyDb, id: string) {
  const user = await db
    .selectFrom("users")
    .innerJoin("userProfiles", "users.id", "userProfiles.id")
    .select([
      "users.id",
      "users.email",
      "users.isSuperAdmin",
      "users.emailVerifiedAt",
      "userProfiles.fullName",
    ])
    .where("users.id", "=", id)
    .executeTakeFirst()

  return user
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const db = request.context?.db
  if (!db) {
    throw new Error("Database not available in request context")
  }
  const cookieName = envVars.COOKIE_NAME as string
  const sessionId = getCookieFromHeader(request, cookieName)
  if (!sessionId) {
    request.user = undefined
    request.session = undefined
    return
  }

  const session = await validateSession(db, sessionId)
  if (!session) {
    deleteSessionCookie(reply)
    request.user = undefined
    request.session = undefined
    return
  }

  // Fetch user by session.userId
  const user = await _findUserByIdDb(db, session.userId)
  if (!user) {
    deleteSessionCookie(reply)
    request.user = undefined
    request.session = undefined
    return
  }

  // If session was renewed by validateSession, update the cookie
  if (session.fresh) {
    setSessionCookie(reply, session.id, new Date(session.expiresAt))
  }

  // Set the authenticated user and session
  request.user = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
    emailVerified: !!user.emailVerifiedAt,
  }
  request.session = session
}

export function setSessionCookie(
  reply: FastifyReply,
  sessionId: string,
  expiresAt: Date
): void {
  const COOKIE_PATH = "/"
  const MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds
  const SAME_SITE = "None"
  const isProduction = envVars.NODE_ENV === "production"

  const cookieValue = `${envVars.COOKIE_NAME}=${sessionId}; Domain=${envVars.DOMAIN}; Path=${COOKIE_PATH}; HttpOnly; SameSite=${SAME_SITE}; Max-Age=${MAX_AGE}; Secure=${isProduction}; Expires=${expiresAt.toUTCString()}`
  reply.header("Set-Cookie", cookieValue)
}

function deleteSessionCookie(reply: FastifyReply): void {
  const domain = envVars.DOMAIN
  const isIp = domain ? /^\d{1,3}(\.\d{1,3}){3}$/.test(domain) : false
  const domainPart =
    domain && !/localhost/i.test(domain) && !isIp ? `; Domain=${domain}` : ""
  const secure = envVars.NODE_ENV === "production" ? "; Secure" : ""

  const cookieValue = `${envVars.COOKIE_NAME}=; Path=/; HttpOnly; SameSite=None; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}${domainPart}`
  reply.header("Set-Cookie", cookieValue)
}

function getCookieFromHeader(
  request: FastifyRequest,
  cookieName: string
): string | null {
  const cookieHeader = request.headers.cookie
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(";").map((c) => c.trim())
  const targetCookie = cookies.find((cookie) =>
    cookie.startsWith(`${cookieName}=`)
  )

  if (!targetCookie) return null

  return targetCookie.split("=")[1]
}
