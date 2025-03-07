import { generateSentryHeaders } from "@incmix-api/utils"
import type { AuthUser } from "@incmix/utils/types"
import type { MiddlewareHandler } from "hono"
import { getCookie } from "hono/cookie"

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser | null
  }
}

export function createAuthMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const cookieName = process.env["COOKIE_NAME"] ?? "session"
    const sessionId = getCookie(c, cookieName) ?? null

    if (!sessionId) {
      c.set("user", null)
      return next()
    }

    const authUrl = `${process.env["AUTH_URL"]}/validate-session`
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
