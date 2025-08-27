import { env } from "hono/adapter"
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
    `${COOKIE_NAME}=${sessionId}; Domain=${env(c).DOMAIN}; Path=${COOKIE_PATH}; HttpOnly; SameSite=${SAME_SITE}; Max-Age=${MAX_AGE}; Secure=${isProduction()} Expires=${expiresAt.toUTCString()}`
  )
}

export function deleteSessionCookie(c: Context): void {
  c.header(
    "Set-Cookie",
    `${COOKIE_NAME}=; Domain=${env(c).DOMAIN}; Path=${COOKIE_PATH}; HttpOnly; SameSite=${SAME_SITE}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure=${isProduction()}`
  )
}
