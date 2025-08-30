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
  rbac?: PermissionService
) {
  await app.register(
    fp(async (fastify) => {
      fastify.decorateRequest("rbac", null)

      fastify.addHook("onRequest", async (request: FastifyRequest, _reply) => {
        if (!rbac) {
          request.rbac = new PermissionService(request)
        } else {
          request.rbac = rbac
        }
      })
    })
  )
}
