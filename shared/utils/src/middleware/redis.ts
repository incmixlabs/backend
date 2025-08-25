import type { OpenAPIHono } from "@hono/zod-openapi"
import type { Env as HonoEnv } from "hono"
import { env } from "hono/adapter"
import { createClient } from "redis"

declare module "hono" {
  interface ContextVariableMap {
    redis: ReturnType<typeof createClient>
  }
}

type Env = {
  Bindings: { REDIS_URL: string }
} & HonoEnv

export function setupRedisMiddleware<T extends Env>(
  app: OpenAPIHono<T>,
  basePath: string
) {
  app.use(`${basePath}/*`, async (c, next) => {
    const redis = createClient({
      url: env(c).REDIS_URL,
    })

    await redis.connect()

    c.set("redis", redis)

    return next()
  })
}
