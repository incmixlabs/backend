import { envVars } from "@/env-vars"
import type { Context } from "@/types"

const COOKIE_NAME = envVars.COOKIE_NAME
const COOKIE_PATH = "/"
const MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

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
    `${COOKIE_NAME}=${sessionId}; Path=${COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE};${isProduction() ? " Secure;" : ""} Expires=${expiresAt.toUTCString()}`
  )
}

export function deleteSessionCookie(c: Context): void {
  c.header(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=${COOKIE_PATH}; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT;${isProduction() ? " Secure;" : ""}`
  )
}
