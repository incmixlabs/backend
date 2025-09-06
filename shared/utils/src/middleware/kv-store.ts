import { KVStore } from "@incmix-api/utils/kv-store"
import type { FastifyInstance } from "fastify"
import fp from "fastify-plugin"

export async function setupKvStore(
  app: FastifyInstance,
  _basePath: string,
  globalStore: KVStore
) {
  await app.register(
    fp(async (fastify) => {
      if (!fastify.hasRequestDecorator("kv")) {
        fastify.decorateRequest("kv", null as unknown as KVStore | null)
      }

      fastify.addHook("onRequest", async (request, _reply) => {
        if (!globalStore) {
          request.kv = new KVStore({}, 900)
        } else {
          request.kv = globalStore
        }
      })
    })
  )
}

declare module "fastify" {
  interface FastifyRequest {
    kv: KVStore
  }
}
