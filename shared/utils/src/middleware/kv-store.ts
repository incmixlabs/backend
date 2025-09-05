import { KVStore } from "@incmix-api/utils/kv-store"
import type { Env } from "hono"
import type { AjvOpenApiHono } from "../openapi/ajv-openapi"

export function setupKvStore<T extends Env>(
  app: AjvOpenApiHono<T>,
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
