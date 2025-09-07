import type { AuthUser } from "@incmix/utils/types"
import type { FastifyInstance, FastifyRequest } from "fastify"
import fp from "fastify-plugin"
import { envVars } from "../env-config"

declare module "fastify" {
  interface FastifyRequest {
    cookies: Record<string, string>
  }
}

declare module "fastify" {
  interface FastifyRequest {
    user: AuthUser | null
  }
}

export function createAuthMiddleware() {
  return fp(async (fastify: FastifyInstance) => {
    await fastify.register(require("@fastify/cookie"))

    if (!fastify.hasRequestDecorator("user")) {
      fastify.decorateRequest("user", null)
    }
    fastify.addHook("onRequest", async (request: FastifyRequest, _reply) => {
      const cookieName = envVars["COOKIE_NAME"] ?? "session"
      const sessionId = request.cookies?.[cookieName] ?? null

      if (!sessionId) {
        request.user = null
        return
      }

      const authUrl = `${envVars["AUTH_API_URL"]}/validate-session`
      const sentryHeaders = {}
      const res = await fetch(authUrl, {
        method: "get",
        headers: {
          "Content-Type": "application/json",
          cookie: `${cookieName}=${sessionId}`,
          ...sentryHeaders,
        },
      })
      if (!res.ok) {
        request.user = null
        return
      }
      const user = (await res.json()) as AuthUser

      if (user) {
        request.user = user
      }
    })
  })
}
