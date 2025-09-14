import type { OpenAPIHono } from "@hono/zod-openapi"
import type { Env } from "hono"
import { KVStore } from "../kv-store"

export function setupKvStore<T extends Env>(
  app: OpenAPIHono<T>,
  basePath: string,
  globalStore: KVStore
) {
  app.use(`${basePath}/*`, (c, next) => {
    if (!globalStore) {
      c.set("kv", new KVStore({}, 900))
      return next()
    }

    c.set("kv", globalStore)
    return next()
  })
}
