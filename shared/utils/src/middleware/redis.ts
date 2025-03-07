import type { OpenAPIHono } from "@hono/zod-openapi"
import { Redis } from "@upstash/redis/node"
import type { Env as HonoEnv } from "hono"
declare module "hono" {
  interface ContextVariableMap {
    redis: Redis
  }
}

type Env = {
  Bindings: { UPSTASH_REDIS_REST_URL: string; UPSTASH_REDIS_REST_TOKEN: string }
} & HonoEnv

export function setupRedisMiddleware<T extends Env>(
  app: OpenAPIHono<T>,
  basePath: string
) {
  app.use(`${basePath}/*`, (c, next) => {
    const redis = Redis.fromEnv()
    c.set("redis", redis)
    return next()
  })
}
