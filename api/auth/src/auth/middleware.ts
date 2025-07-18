import { env } from "hono/adapter"
import { getCookie } from "hono/cookie"
import type { Context } from "../types"
import { deleteSessionCookie, setSessionCookie } from "./cookies"
import { validateSession } from "./session"

export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const db = c.get("db")
  const cookieName = env(c).COOKIE_NAME
  const sessionId = getCookie(c, cookieName)

  if (!sessionId) {
    c.set("user", null)
    c.set("session", null)
    return await next()
  }

  const session = await validateSession(db, sessionId)
  if (!session) {
    deleteSessionCookie(c)
    c.set("user", null)
    c.set("session", null)
    return await next()
  }

  // Fetch user by session.userId
  const user = await db
    .selectFrom("users")
    .selectAll()
    .where("id", "=", session.userId)
    .executeTakeFirst()

  if (!user) {
    deleteSessionCookie(c)
    c.set("user", null)
    c.set("session", null)
    return await next()
  }

  // If session was renewed, update cookie
  const now = new Date()
  const expiresAt = new Date(session.expiresAt)
  // Renew if less than 15 days left (halfway)
  if (expiresAt.getTime() - now.getTime() < 15 * 24 * 60 * 60 * 1000) {
    setSessionCookie(c, session.id, expiresAt)
  }

  c.set("user", {
    email: user.email,
    userType: user.userType,
    emailVerified: user.emailVerifiedAt !== null,
    id: user.id,
  })
  c.set("session", session)
  return await next()
}
