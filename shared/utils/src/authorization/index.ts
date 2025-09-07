export * from "./casl"

import type { FastifyInstance, FastifyRequest } from "fastify"
import fp from "fastify-plugin"
import { PermissionService } from "./casl"

declare module "fastify" {
  interface FastifyRequest {
    rbac: PermissionService
  }
}

export async function setupRbac(
  app: FastifyInstance,
  _basePath: string,
  rbacFactory?: (
    req: FastifyRequest
  ) => PermissionService | Promise<PermissionService>
) {
  await app.register(
    fp((fastify) => {
      fastify.decorateRequest("rbac", null as any)

      fastify.addHook("onRequest", async (request: FastifyRequest, _reply) => {
        request.rbac = rbacFactory
          ? await rbacFactory(request)
          : new PermissionService(request)
      })
    })
  )
}
