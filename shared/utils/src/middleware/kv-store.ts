import { KVStore } from "@incmix-api/utils/kv-store"
import type { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import { envVars } from "../env-config"

export async function setupKvStore(
  app: FastifyInstance,
  _basePath: string,
  globalStore: KVStore
) {
  const ttl = Number(envVars.KV_DEFAULT_TTL ?? 900)
  await app.register(
    fp((fastify) => {
      if (!fastify.hasRequestDecorator("kv")) {
        fastify.decorateRequest("kv", null as any)
      }

      fastify.addHook("onRequest", (request, _reply) => {
        request.kv = globalStore ?? new KVStore({}, ttl)
      })
    })
  )
}

declare module "fastify" {
  interface FastifyRequest {
    kv: KVStore
  }
}
