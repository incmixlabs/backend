import { generateSentryHeaders } from "@incmix-api/utils"
import type { AuthUser } from "@incmix/utils/types"
import type { MiddlewareHandler } from "hono"
import { getCookie } from "hono/cookie"
import { envVars } from "../env-config"

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser | null
  }
}

export function createAuthMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const cookieName = (envVars.COOKIE_NAME ?? "session") as string
    const sessionId = getCookie(c, cookieName) ?? null

    if (!sessionId) {
      c.set("user", null)
      return next()
    }

    const authApiUrl = envVars.AUTH_API_URL
    if (!authApiUrl) {
      console.error("AUTH_API_URL is not configured")
      c.set("user", null)
      return next()
    }

    const authUrl = `${authApiUrl}/validate-session`
    const sentryHeaders = generateSentryHeaders(c)
    const res = await fetch(authUrl, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        cookie: `${cookieName}=${sessionId}`,
        ...sentryHeaders,
      },
    })
    if (!res.ok) {
      c.set("user", null)
      return next()
    }
    const user = (await res.json()) as AuthUser

    if (user) {
      c.set("user", user)
    }
    return next()
  }
}
