import type {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyReply,
  FastifyRequest,
} from "fastify"
import fp from "fastify-plugin"
import { findUserById } from "@/lib/db"
import { envVars } from "../env-vars"
import { deleteSessionCookie, setSessionCookie } from "./cookies"
import { validateSession } from "./session"

async function authMiddlewareHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const db = request.db
  if (!db) {
    reply.code(500).send({ error: "Database not available" })
    return
  }

  const cookieName = envVars.COOKIE_NAME as string
  const sessionId = request.cookies?.[cookieName]

  if (!sessionId) {
    request.user = null
    request.session = null
    return
  }

  const session = await validateSession(db, sessionId)
  if (!session) {
    deleteSessionCookie(request, reply)
    request.user = null
    request.session = null
    return
  }

  // Fetch user by session.userId
  const user = await findUserById(request, session.userId)

  if (!user) {
    deleteSessionCookie(request, reply)
    request.user = null
    request.session = null
    return
  }

  // If session was renewed, update cookie
  const now = new Date()
  const expiresAt = new Date(session.expiresAt)
  // Renew if less than 15 days left (halfway)
  if (expiresAt.getTime() - now.getTime() < 15 * 24 * 60 * 60 * 1000) {
    setSessionCookie(request, reply, session.id, expiresAt)
  }

  request.user = {
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
    emailVerified: user.emailVerifiedAt !== null,
    id: user.id,
  }
  request.session = session
}

const authMiddleware: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _options,
  done
) => {
  fastify.addHook("onRequest", authMiddlewareHandler)
  done()
}

export default fp(authMiddleware)
