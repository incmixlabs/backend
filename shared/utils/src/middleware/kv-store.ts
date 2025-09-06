import type { Env } from "hono"

export function setupKvStore<T extends Env>(
  app: Hono<T>,
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
