import { BASE_PATH } from "@/lib/constants"
import type { HonoApp } from "@/types"
import { cloudflareRateLimiter } from "@hono-rate-limiter/cloudflare"
import type { OpenAPIHono } from "@hono/zod-openapi"
import { BadRequestError } from "@incmix-api/utils/errors"
import {
  createI18nMiddleware,
  setupCors,
  setupOpenApi,
  setupRedisMiddleware,
  setupSentryMiddleware,
} from "@incmix-api/utils/middleware"
import { getConnInfo } from "hono/cloudflare-workers"

export const rateLimiter = cloudflareRateLimiter<HonoApp>({
  rateLimitBinding: (c) => c.env.RATE_LIMITER,
  keyGenerator: (c) => {
    const connInfo = getConnInfo(c)
    const userIp = connInfo.remote.address
    if (!userIp) throw new BadRequestError("Invalid Request Format")
    return userIp
  },
})

export const middlewares = (app: OpenAPIHono<HonoApp>) => {
  setupCors(app, BASE_PATH)

  setupSentryMiddleware(app, BASE_PATH, "location-api")

  app.use(`${BASE_PATH}/*`, createI18nMiddleware())
  setupRedisMiddleware(app, BASE_PATH)
  setupOpenApi(app, BASE_PATH, "Location Api")
}
