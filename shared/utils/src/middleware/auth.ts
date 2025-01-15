import type { OpenAPIHono } from "@hono/zod-openapi"
import { generateSentryHeaders } from "@incmix-api/utils"
import type { AuthUser } from "@incmix/shared/types"
import type { Env as HonoEnv } from "hono"
import { getCookie } from "hono/cookie"

declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser | null
  }
}

type Env = {
  Bindings: { AUTH_URL: string; AUTH: Fetcher; COOKIE_NAME: string }
} & HonoEnv

export function setupAuthMiddleware<T extends Env>(
  app: OpenAPIHono<T>,
  basePath: string
) {
  app.use(`${basePath}/*`, async (c, next) => {
    const sessionId = getCookie(c, c.env.COOKIE_NAME) ?? null

    if (!sessionId) {
      c.set("user", null)
      return next()
    }

    const authUrl = `${c.env.AUTH_URL}/validate-session`
    const sentryHeaders = generateSentryHeaders(c)
    const res = await c.env.AUTH.fetch(authUrl, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        cookie: `${c.env.COOKIE_NAME}=${sessionId}`,
        ...sentryHeaders,
      },
    })
    if (!res.ok) {
      c.set("user", null)
      return next()
    }
    const user = await res.json<AuthUser>()

    if (user) {
      c.set("user", user)
    }
    return next()
  })
}
