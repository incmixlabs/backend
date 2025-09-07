import type { FastifyReply, FastifyRequest } from "fastify"
import { envVars } from "@/env-vars"

declare module "fastify" {
  interface FastifyReply {
    setCookie(name: string, value: string, options?: any): this
    clearCookie(name: string, options?: any): this
  }
}

const COOKIE_NAME = envVars.COOKIE_NAME
const COOKIE_PATH = "/"
const MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds
const SAME_SITE = "None" as const
function isProduction(): boolean {
  return envVars.NODE_ENV === "production"
}

export function setSessionCookie(
  _request: FastifyRequest,
  reply: FastifyReply,
  sessionId: string,
  expiresAt: Date
): void {
  reply.setCookie(COOKIE_NAME, sessionId, {
    domain: envVars.DOMAIN,
    path: COOKIE_PATH,
    httpOnly: true,
    sameSite: SAME_SITE,
    maxAge: MAX_AGE,
    secure: isProduction(),
    expires: expiresAt,
  })
}

export function deleteSessionCookie(
   _request: FastifyRequest,
   reply: FastifyReply
 ): void {

  const domain = envVars.DOMAIN
  const isIp = domain ? /^\d{1,3}(\.\d{1,3}){3}$/.test(domain) : false
  const domainConfig =
     domain && !/localhost/i.test(domain) && !isIp ? envVars.DOMAIN : undefined

  reply.clearCookie(COOKIE_NAME, {
    domain: domainConfig,
    path: COOKIE_PATH,
    httpOnly: true,
    sameSite: SAME_SITE,
    secure: isProduction(),
  })
}
