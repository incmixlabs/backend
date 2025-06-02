import { BASE_PATH } from "@/lib/constants"
import { createSession, initializeLucia } from "@/lib/lucia"
import type { HonoApp } from "@/types"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { initDb } from "@incmix-api/utils/db-schema"
import {
  createI18nMiddleware,
  setupCors,
  setupOpenApi,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"
import { env } from "hono/adapter"
import { compress } from "hono/compress"
import { getCookie, setCookie } from "hono/cookie"

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  app.use("*", compress({ encoding: "gzip" }))
  setupCors(app, BASE_PATH)
  setupSentryMiddleware(app, BASE_PATH, "auth")

  app.use(`${BASE_PATH}/*`, createI18nMiddleware())

  app.use(`${BASE_PATH}/*`, async (c, next) => {
    const lucia = initializeLucia(c)
    const sessionId = getCookie(c, lucia.sessionCookieName) ?? null

    if (!sessionId) {
      c.set("user", null)
      c.set("session", null)
      return await next()
    }

    const { session, user } = await lucia.validateSession(sessionId)
    if (!user) {
      const blankCookie = lucia.createBlankSessionCookie()
      setCookie(c, blankCookie.name, blankCookie.value, blankCookie.attributes)
      return await next()
    }

    if (session?.fresh) {
      createSession(c, user.id)
    }

    c.set("user", user)
    c.set("session", session)

    await next()
  })

  setupOpenApi(app, BASE_PATH, "Auth Api")

  app.use(`${BASE_PATH}/*`, (c, next) => {
    c.set("db", initDb(env(c).DATABASE_URL))
    return next()
  })
}
