import { envVars } from "@/env-vars"
import type { Context } from "@/types"

const COOKIE_NAME = envVars.COOKIE_NAME
const COOKIE_PATH = "/"
const MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds
const SAME_SITE = "None"
function isProduction(): boolean {
  return envVars.NODE_ENV === "production"
}

export function setSessionCookie(
  c: Context,
  sessionId: string,
  expiresAt: Date
): void {
  c.header(
    "Set-Cookie",
    `${COOKIE_NAME}=${sessionId}; Domain=${envVars.DOMAIN}; Path=${COOKIE_PATH}; HttpOnly; SameSite=${SAME_SITE}; Max-Age=${MAX_AGE}; Secure=${isProduction()}; Expires=${expiresAt.toUTCString()}`
  )
}

export function deleteSessionCookie(c: Context): void {
  const domain = envVars.DOMAIN
  const isIp = domain ? /^\d{1,3}(\.\d{1,3}){3}$/.test(domain) : false
  const domainPart =
    domain && !/localhost/i.test(domain) && !isIp ? `; Domain=${domain}` : ""
  const cookie = `${COOKIE_NAME}=; Path=${COOKIE_PATH}; HttpOnly; SameSite=${SAME_SITE}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure${domainPart}`
  c.header("Set-Cookie", cookie, { append: true })
}
